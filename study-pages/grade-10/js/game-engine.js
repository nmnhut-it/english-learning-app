/**
 * Game Engine for English Learning App
 * Grade 10 - Global Success
 * Features: Scoring, Telegram Integration, Multiple Exercise Types
 */

const GameEngine = {
  // State
  currentUnit: 1,
  currentSection: 'vocabulary',
  score: 0,
  correctAnswers: 0,
  totalQuestions: 0,
  currentQuestionIndex: 0,
  combo: 0,
  maxCombo: 0,
  hintsUsed: 0,
  startTime: null,
  questionStartTime: null,
  answerHistory: [],

  // Telegram Config
  telegramBotToken: '',
  telegramChatId: '',
  studentName: '',

  // Constants
  POINTS_PER_QUESTION: 10,
  TIME_BONUS_THRESHOLD: 5000, // 5 seconds
  TIME_BONUS_POINTS: 5,
  COMBO_THRESHOLD: 3,
  COMBO_MULTIPLIER: 1.5,
  HINT_PENALTY: 2,

  /**
   * Initialize the game engine
   */
  init(config = {}) {
    this.telegramBotToken = config.telegramBotToken || '';
    this.telegramChatId = config.telegramChatId || '';
    this.studentName = config.studentName || 'Student';
    this.reset();
    this.loadProgress();
    this.initUI();
    console.log('Game Engine initialized');
  },

  /**
   * Reset game state
   */
  reset() {
    this.score = 0;
    this.correctAnswers = 0;
    this.totalQuestions = 0;
    this.currentQuestionIndex = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.hintsUsed = 0;
    this.startTime = Date.now();
    this.answerHistory = [];
  },

  /**
   * Initialize UI elements
   */
  initUI() {
    // Unit navigation
    document.querySelectorAll('.unit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const unit = parseInt(e.target.dataset.unit);
        this.loadUnit(unit);
      });
    });

    // Section tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const section = e.target.dataset.section;
        this.loadSection(section);
      });
    });

    // Collapsible sections
    document.querySelectorAll('.section-header').forEach(header => {
      header.addEventListener('click', () => {
        header.classList.toggle('collapsed');
        const content = header.nextElementSibling;
        content.classList.toggle('hidden');
      });
    });
  },

  /**
   * Load a specific unit
   */
  loadUnit(unitNumber) {
    this.currentUnit = unitNumber;
    this.reset();

    // Update UI
    document.querySelectorAll('.unit-btn').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.unit) === unitNumber);
    });

    // Load unit content
    this.loadUnitContent(unitNumber);
    console.log(`Loaded Unit ${unitNumber}`);
  },

  /**
   * Load a specific section (vocab, grammar, reading, speaking)
   */
  loadSection(sectionName) {
    this.currentSection = sectionName;

    // Update tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.section === sectionName);
    });

    // Show/hide sections
    document.querySelectorAll('.section-panel').forEach(panel => {
      panel.classList.toggle('hidden', panel.dataset.section !== sectionName);
    });

    console.log(`Loaded section: ${sectionName}`);
  },

  /**
   * Load unit content from data
   */
  async loadUnitContent(unitNumber) {
    try {
      const response = await fetch(`data/unit-${unitNumber}.json`);
      const data = await response.json();
      this.renderUnit(data);
    } catch (error) {
      console.log('Loading embedded data for unit', unitNumber);
      // Use embedded data if fetch fails
      if (window.UNIT_DATA && window.UNIT_DATA[unitNumber]) {
        this.renderUnit(window.UNIT_DATA[unitNumber]);
      }
    }
  },

  /**
   * Render unit content
   */
  renderUnit(unitData) {
    // Render vocabulary
    if (unitData.vocabulary) {
      this.renderVocabulary(unitData.vocabulary);
    }

    // Render grammar
    if (unitData.grammar) {
      this.renderGrammar(unitData.grammar);
    }

    // Render reading
    if (unitData.reading) {
      this.renderReading(unitData.reading);
    }

    // Render speaking
    if (unitData.speaking) {
      this.renderSpeaking(unitData.speaking);
    }

    // Render exercises
    if (unitData.exercises) {
      this.renderExercises(unitData.exercises);
    }
  },

  /**
   * Render vocabulary cards with examples for self-learners
   */
  renderVocabulary(vocabulary) {
    const container = document.getElementById('vocab-container');
    if (!container) return;

    container.innerHTML = vocabulary.map((item, index) => `
      <div class="vocab-card fade-in" style="animation-delay: ${index * 50}ms">
        <div class="vocab-word">
          <span class="word">${item.word}</span>
          <span class="pos">${item.pos || ''}</span>
          <button class="speak-btn" onclick="GameEngine.speak('${item.word}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
          </button>
        </div>
        <div class="vocab-pronunciation">/${item.pronunciation || ''}/</div>
        <div class="vocab-meaning">${item.meaning}</div>
        ${item.example ? `
          <div class="vocab-example">
            <div class="vocab-example-en">${item.example}</div>
            ${item.exampleVi ? `<div class="vocab-example-vi">${item.exampleVi}</div>` : ''}
          </div>
        ` : ''}
      </div>
    `).join('');
  },

  /**
   * Render grammar section
   */
  renderGrammar(grammar) {
    const container = document.getElementById('grammar-container');
    if (!container) return;

    container.innerHTML = `
      <div class="grammar-box">
        <h3>${grammar.title}</h3>
        ${grammar.rules.map(rule => `
          <div class="grammar-rule">
            <strong>${rule.name}:</strong> ${rule.formula}
            ${rule.examples ? `
              <div class="grammar-example">
                ${rule.examples.map(ex => `<p>• ${ex}</p>`).join('')}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  },

  /**
   * Render reading section
   */
  renderReading(reading) {
    const container = document.getElementById('reading-container');
    if (!container) return;

    container.innerHTML = `
      <div class="reading-passage">
        <h3>${reading.title}</h3>
        ${reading.paragraphs.map(p => `<p>${p}</p>`).join('')}
      </div>
    `;
  },

  /**
   * Render speaking section
   */
  renderSpeaking(speaking) {
    const container = document.getElementById('speaking-container');
    if (!container) return;

    container.innerHTML = `
      <div class="dialogue-container">
        <h3>${speaking.title}</h3>
        ${speaking.dialogue.map(line => `
          <div class="dialogue-line">
            <span class="dialogue-speaker">${line.speaker}:</span>
            <div class="dialogue-text">
              ${line.text}
              ${line.translation ? `<div class="dialogue-translation">${line.translation}</div>` : ''}
            </div>
            <button class="speak-btn" onclick="GameEngine.speak('${line.text.replace(/'/g, "\\'")}')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
              </svg>
            </button>
          </div>
        `).join('')}
      </div>
    `;
  },

  /**
   * Render exercises
   */
  renderExercises(exercises) {
    const container = document.getElementById('exercises-container');
    if (!container) return;

    this.totalQuestions = exercises.length;
    this.currentQuestionIndex = 0;

    container.innerHTML = exercises.map((ex, index) =>
      this.renderExercise(ex, index)
    ).join('');

    this.updateProgress();
  },

  /**
   * Render a single exercise based on type
   */
  renderExercise(exercise, index) {
    const handlers = {
      'multiple-choice': this.renderMultipleChoice.bind(this),
      'fill-blank': this.renderFillBlank.bind(this),
      'true-false': this.renderTrueFalse.bind(this),
      'sentence-rewrite': this.renderSentenceRewrite.bind(this),
      'matching': this.renderMatching.bind(this),
      'word-order': this.renderWordOrder.bind(this)
    };

    const handler = handlers[exercise.type] || this.renderMultipleChoice.bind(this);
    return handler(exercise, index);
  },

  /**
   * Multiple Choice Exercise - With detailed explanations for self-learners
   */
  renderMultipleChoice(exercise, index) {
    return `
      <div class="exercise-container fade-in" data-index="${index}" data-type="multiple-choice"
           data-explanation="${this.escapeHtml(exercise.explanation || '')}"
           data-grammar-rule="${this.escapeHtml(exercise.grammarRule || '')}"
           data-tip="${this.escapeHtml(exercise.tip || '')}">
        <div class="exercise-header">
          <span class="exercise-title">Câu ${index + 1} / Question ${index + 1}</span>
          <span class="exercise-progress">${index + 1}/${this.totalQuestions}</span>
        </div>
        ${exercise.instruction ? `<p class="exercise-instruction">${exercise.instruction}</p>` : ''}
        <p class="exercise-question">${exercise.question}</p>
        ${exercise.questionVi ? `<p class="exercise-question-vi">${exercise.questionVi}</p>` : ''}
        <div class="options-container">
          ${exercise.options.map((opt, i) => `
            <button class="option-btn" data-answer="${opt}" onclick="GameEngine.checkAnswer(${index}, '${opt.replace(/'/g, "\\'")}', '${exercise.correct.replace(/'/g, "\\'")}')">
              <span class="option-label">${String.fromCharCode(65 + i)}</span>
              <span class="option-text">${opt}</span>
            </button>
          `).join('')}
        </div>
        <div class="feedback-container"></div>
      </div>
    `;
  },

  /**
   * Escape HTML for data attributes
   */
  escapeHtml(text) {
    if (!text) return '';
    return text.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  },

  /**
   * Fill in the Blank Exercise - With detailed explanations
   */
  renderFillBlank(exercise, index) {
    const questionHtml = exercise.sentence.replace('_____',
      `<input type="text" class="fill-blank-input" data-correct="${exercise.correct}" placeholder="...">`
    );

    return `
      <div class="exercise-container fade-in" data-index="${index}" data-type="fill-blank"
           data-explanation="${this.escapeHtml(exercise.explanation || '')}"
           data-grammar-rule="${this.escapeHtml(exercise.grammarRule || '')}"
           data-tip="${this.escapeHtml(exercise.tip || '')}">
        <div class="exercise-header">
          <span class="exercise-title">Câu ${index + 1} / Question ${index + 1}</span>
          <span class="exercise-progress">${index + 1}/${this.totalQuestions}</span>
        </div>
        ${exercise.instruction ? `<p class="exercise-instruction">${exercise.instruction}</p>` : ''}
        <p class="exercise-question">${questionHtml}</p>
        ${exercise.sentenceVi ? `<p class="exercise-question-vi">${exercise.sentenceVi}</p>` : ''}
        <button class="btn btn-primary" onclick="GameEngine.checkFillBlank(${index})">Kiểm tra / Check</button>
        <div class="feedback-container"></div>
      </div>
    `;
  },

  /**
   * True/False Exercise - With detailed explanations
   */
  renderTrueFalse(exercise, index) {
    return `
      <div class="exercise-container fade-in" data-index="${index}" data-type="true-false"
           data-explanation="${this.escapeHtml(exercise.explanation || '')}"
           data-grammar-rule="${this.escapeHtml(exercise.grammarRule || '')}"
           data-tip="${this.escapeHtml(exercise.tip || '')}">
        <div class="exercise-header">
          <span class="exercise-title">Câu ${index + 1} / Question ${index + 1}</span>
          <span class="exercise-progress">${index + 1}/${this.totalQuestions}</span>
        </div>
        ${exercise.instruction ? `<p class="exercise-instruction">${exercise.instruction}</p>` : ''}
        <p class="exercise-question">${exercise.statement}</p>
        ${exercise.statementVi ? `<p class="exercise-question-vi">${exercise.statementVi}</p>` : ''}
        <div class="options-container" style="flex-direction: row; gap: 1rem;">
          <button class="option-btn" style="flex: 1;" onclick="GameEngine.checkAnswer(${index}, 'true', '${exercise.correct}')">
            <span class="option-label">T</span>
            <span>True / Đúng</span>
          </button>
          <button class="option-btn" style="flex: 1;" onclick="GameEngine.checkAnswer(${index}, 'false', '${exercise.correct}')">
            <span class="option-label">F</span>
            <span>False / Sai</span>
          </button>
        </div>
        <div class="feedback-container"></div>
      </div>
    `;
  },

  /**
   * Sentence Rewrite Exercise - With detailed explanations
   */
  renderSentenceRewrite(exercise, index) {
    return `
      <div class="exercise-container fade-in" data-index="${index}" data-type="sentence-rewrite"
           data-explanation="${this.escapeHtml(exercise.explanation || '')}"
           data-grammar-rule="${this.escapeHtml(exercise.grammarRule || '')}"
           data-tip="${this.escapeHtml(exercise.tip || '')}">
        <div class="exercise-header">
          <span class="exercise-title">Câu ${index + 1} / Question ${index + 1}</span>
          <span class="exercise-progress">${index + 1}/${this.totalQuestions}</span>
        </div>
        <p class="exercise-instruction">${exercise.instruction || 'Viết lại câu / Rewrite the sentence:'}</p>
        <p class="exercise-question">${exercise.original}</p>
        ${exercise.originalVi ? `<p class="exercise-question-vi">${exercise.originalVi}</p>` : ''}
        ${exercise.prompt ? `<p><strong>Bắt đầu bằng:</strong> ${exercise.prompt}</p>` : ''}
        <textarea class="fill-blank-input" style="width: 100%; min-height: 80px; resize: vertical;"
          data-correct="${exercise.correct}" placeholder="Viết câu trả lời của bạn..."></textarea>
        <button class="btn btn-primary" onclick="GameEngine.checkRewrite(${index})">Kiểm tra / Check</button>
        <div class="feedback-container"></div>
      </div>
    `;
  },

  /**
   * Matching Exercise
   */
  renderMatching(exercise, index) {
    return `
      <div class="exercise-container fade-in" data-index="${index}" data-type="matching">
        <div class="exercise-header">
          <span class="exercise-title">Question ${index + 1}</span>
          <span class="exercise-progress">${index + 1}/${this.totalQuestions}</span>
        </div>
        <p class="exercise-instruction">Match the items:</p>
        <div class="matching-container" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="matching-left">
            ${exercise.left.map((item, i) => `
              <div class="word-tile" data-left="${i}">${i + 1}. ${item}</div>
            `).join('')}
          </div>
          <div class="matching-right">
            ${exercise.right.map((item, i) => `
              <div class="word-tile" data-right="${i}">${String.fromCharCode(97 + i)}. ${item}</div>
            `).join('')}
          </div>
        </div>
        <div class="feedback-container"></div>
      </div>
    `;
  },

  /**
   * Word Order Exercise
   */
  renderWordOrder(exercise, index) {
    const shuffled = [...exercise.words].sort(() => Math.random() - 0.5);
    return `
      <div class="exercise-container fade-in" data-index="${index}" data-type="word-order">
        <div class="exercise-header">
          <span class="exercise-title">Question ${index + 1}</span>
          <span class="exercise-progress">${index + 1}/${this.totalQuestions}</span>
        </div>
        <p class="exercise-instruction">Arrange the words to make a correct sentence:</p>
        <div class="sentence-builder" id="builder-${index}"></div>
        <div class="word-tiles" id="tiles-${index}">
          ${shuffled.map(word => `
            <span class="word-tile" onclick="GameEngine.selectWord(${index}, this)">${word}</span>
          `).join('')}
        </div>
        <button class="btn btn-secondary" onclick="GameEngine.resetWordOrder(${index})">Reset</button>
        <button class="btn btn-primary" onclick="GameEngine.checkWordOrder(${index}, '${exercise.correct}')">Check</button>
        <div class="feedback-container"></div>
      </div>
    `;
  },

  /**
   * Word order helper - select word
   */
  selectWord(index, element) {
    const builder = document.getElementById(`builder-${index}`);
    const word = element.textContent;

    // Add to builder
    const placed = document.createElement('span');
    placed.className = 'placed-word';
    placed.textContent = word;
    placed.onclick = () => {
      placed.remove();
      element.classList.remove('used');
    };
    builder.appendChild(placed);

    element.classList.add('used');
  },

  /**
   * Reset word order
   */
  resetWordOrder(index) {
    const builder = document.getElementById(`builder-${index}`);
    const tiles = document.getElementById(`tiles-${index}`);
    builder.innerHTML = '';
    tiles.querySelectorAll('.word-tile').forEach(tile => tile.classList.remove('used'));
  },

  /**
   * Check word order answer
   */
  checkWordOrder(index, correct) {
    const builder = document.getElementById(`builder-${index}`);
    const words = Array.from(builder.querySelectorAll('.placed-word')).map(el => el.textContent);
    const answer = words.join(' ');

    const isCorrect = answer.toLowerCase().trim() === correct.toLowerCase().trim();
    this.handleAnswer(index, isCorrect, answer, correct);
  },

  /**
   * Check multiple choice answer
   */
  checkAnswer(index, selected, correct) {
    const container = document.querySelector(`.exercise-container[data-index="${index}"]`);
    if (container.classList.contains('answered')) return;

    container.classList.add('answered');
    const buttons = container.querySelectorAll('.option-btn');

    buttons.forEach(btn => {
      btn.classList.add('disabled');
      if (btn.dataset.answer === correct) {
        btn.classList.add('correct');
      } else if (btn.dataset.answer === selected && selected !== correct) {
        btn.classList.add('incorrect');
      }
    });

    const isCorrect = selected === correct;
    this.handleAnswer(index, isCorrect, selected, correct);
  },

  /**
   * Check fill in blank answer
   */
  checkFillBlank(index) {
    const container = document.querySelector(`.exercise-container[data-index="${index}"]`);
    if (container.classList.contains('answered')) return;

    const input = container.querySelector('.fill-blank-input');
    const correct = input.dataset.correct;
    const answer = input.value.trim();

    container.classList.add('answered');
    input.disabled = true;

    const isCorrect = answer.toLowerCase() === correct.toLowerCase();
    input.classList.add(isCorrect ? 'correct' : 'incorrect');

    this.handleAnswer(index, isCorrect, answer, correct);
  },

  /**
   * Check sentence rewrite answer
   */
  checkRewrite(index) {
    const container = document.querySelector(`.exercise-container[data-index="${index}"]`);
    if (container.classList.contains('answered')) return;

    const textarea = container.querySelector('textarea');
    const correct = textarea.dataset.correct;
    const answer = textarea.value.trim();

    container.classList.add('answered');
    textarea.disabled = true;

    // More lenient comparison for rewrites
    const normalize = (s) => s.toLowerCase().replace(/[.,!?]/g, '').trim();
    const isCorrect = normalize(answer) === normalize(correct);

    textarea.classList.add(isCorrect ? 'correct' : 'incorrect');
    this.handleAnswer(index, isCorrect, answer, correct);
  },

  /**
   * Handle answer result
   */
  handleAnswer(index, isCorrect, userAnswer, correctAnswer) {
    const container = document.querySelector(`.exercise-container[data-index="${index}"]`);
    const feedbackContainer = container.querySelector('.feedback-container');

    // Calculate points
    let points = 0;
    let bonuses = [];

    if (isCorrect) {
      this.correctAnswers++;
      this.combo++;
      this.maxCombo = Math.max(this.maxCombo, this.combo);

      // Base points
      points = this.POINTS_PER_QUESTION;

      // Time bonus
      const timeTaken = Date.now() - (this.questionStartTime || this.startTime);
      if (timeTaken < this.TIME_BONUS_THRESHOLD) {
        points += this.TIME_BONUS_POINTS;
        bonuses.push(`+${this.TIME_BONUS_POINTS} Speed Bonus!`);
      }

      // Combo bonus
      if (this.combo >= this.COMBO_THRESHOLD) {
        const comboBonus = Math.floor(points * (this.COMBO_MULTIPLIER - 1));
        points += comboBonus;
        bonuses.push(`+${comboBonus} Combo x${this.combo}!`);
      }
    } else {
      this.combo = 0;
    }

    this.score += points;

    // Record answer
    this.answerHistory.push({
      index,
      isCorrect,
      userAnswer,
      correctAnswer,
      points
    });

    // Get explanation data from container
    const explanation = container.dataset.explanation || '';
    const grammarRule = container.dataset.grammarRule || '';
    const tip = container.dataset.tip || '';

    // Show detailed feedback for self-learners
    feedbackContainer.innerHTML = `
      <div class="feedback ${isCorrect ? 'success' : 'error'}">
        <div class="feedback-header">
          <span class="feedback-icon">${isCorrect ? '✓' : '✗'}</span>
          <span class="feedback-status">${isCorrect ? 'Chính xác! / Correct!' : 'Chưa đúng / Incorrect'}</span>
          ${isCorrect && points > 0 ? `<span class="feedback-points">+${points} điểm</span>` : ''}
        </div>
        ${bonuses.length > 0 ? `<div class="feedback-bonuses">${bonuses.join(' ')}</div>` : ''}
        ${!isCorrect ? `<div class="feedback-correct"><strong>Đáp án đúng:</strong> ${correctAnswer}</div>` : ''}

        ${explanation ? `
          <div class="feedback-explanation">
            <strong>📝 Giải thích:</strong>
            <p>${explanation}</p>
          </div>
        ` : ''}

        ${grammarRule ? `
          <div class="feedback-grammar">
            <strong>📚 Công thức:</strong> ${grammarRule}
          </div>
        ` : ''}

        ${tip ? `
          <div class="feedback-tip">
            <strong>💡 Mẹo nhớ:</strong> ${tip}
          </div>
        ` : ''}
      </div>
    `;

    this.updateProgress();
    this.questionStartTime = Date.now();

    // Check if all questions answered
    if (this.answerHistory.length === this.totalQuestions) {
      setTimeout(() => this.showResults(), 1000);
    }
  },

  /**
   * Update progress display
   */
  updateProgress() {
    const progressBar = document.querySelector('.progress-bar');
    const scoreDisplay = document.getElementById('current-score');
    const comboDisplay = document.getElementById('current-combo');

    if (progressBar) {
      const progress = (this.answerHistory.length / this.totalQuestions) * 100;
      progressBar.style.width = `${progress}%`;
    }

    if (scoreDisplay) {
      scoreDisplay.textContent = this.score;
    }

    if (comboDisplay) {
      comboDisplay.textContent = this.combo > 0 ? `x${this.combo}` : '-';
    }
  },

  /**
   * Show results modal
   */
  showResults() {
    const accuracy = Math.round((this.correctAnswers / this.totalQuestions) * 100);
    const stars = accuracy >= 90 ? 3 : accuracy >= 70 ? 2 : accuracy >= 50 ? 1 : 0;
    const timeSpent = Math.round((Date.now() - this.startTime) / 1000);

    const modal = document.getElementById('results-modal');
    if (modal) {
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <div class="stars">${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
            <h2>${accuracy >= 70 ? 'Great Job!' : 'Keep Practicing!'}</h2>
          </div>
          <div class="score-display">
            <div class="score-item">
              <div class="score-value">${this.score}</div>
              <div class="score-label">Points</div>
            </div>
            <div class="score-item">
              <div class="score-value">${accuracy}%</div>
              <div class="score-label">Accuracy</div>
            </div>
            <div class="score-item">
              <div class="score-value">${this.correctAnswers}/${this.totalQuestions}</div>
              <div class="score-label">Correct</div>
            </div>
            <div class="score-item">
              <div class="score-value">${this.maxCombo}</div>
              <div class="score-label">Max Combo</div>
            </div>
          </div>
          <p style="text-align: center; margin: 1rem 0;">Time: ${Math.floor(timeSpent / 60)}m ${timeSpent % 60}s</p>
          <div style="display: flex; gap: 1rem; justify-content: center; margin-top: 1.5rem;">
            <button class="btn btn-secondary" onclick="GameEngine.closeResults()">Close</button>
            <button class="btn btn-telegram" onclick="GameEngine.sendToTelegram()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.03-1.99 1.27-5.62 3.72-.53.36-1.01.54-1.44.53-.47-.01-1.38-.27-2.06-.49-.83-.27-1.49-.42-1.43-.89.03-.24.37-.49 1.02-.75 4.02-1.75 6.7-2.91 8.03-3.46 3.83-1.6 4.63-1.88 5.15-1.89.11 0 .37.03.54.18.14.12.18.28.2.46-.01.06.01.24 0 .38z"/>
              </svg>
              Send to Telegram
            </button>
          </div>
        </div>
      `;
      modal.classList.add('active');
    }

    // Save progress
    this.saveProgress();
  },

  /**
   * Close results modal
   */
  closeResults() {
    const modal = document.getElementById('results-modal');
    if (modal) {
      modal.classList.remove('active');
    }
  },

  /**
   * Send results to Telegram
   */
  async sendToTelegram() {
    if (!this.telegramBotToken || !this.telegramChatId) {
      alert('Telegram not configured. Please set up bot token and chat ID.');
      return;
    }

    const accuracy = Math.round((this.correctAnswers / this.totalQuestions) * 100);
    const stars = '⭐'.repeat(accuracy >= 90 ? 3 : accuracy >= 70 ? 2 : accuracy >= 50 ? 1 : 0);
    const timeSpent = Math.round((Date.now() - this.startTime) / 1000);

    const message = `
📚 *English Learning Results*
━━━━━━━━━━━━━━━━━━
👤 Student: ${this.studentName}
📖 Unit ${this.currentUnit} - ${this.currentSection}
━━━━━━━━━━━━━━━━━━
${stars} Rating
🎯 Score: ${this.score} points
✅ Correct: ${this.correctAnswers}/${this.totalQuestions} (${accuracy}%)
🔥 Max Combo: ${this.maxCombo}
⏱ Time: ${Math.floor(timeSpent / 60)}m ${timeSpent % 60}s
━━━━━━━━━━━━━━━━━━
📅 ${new Date().toLocaleString()}
    `.trim();

    try {
      const response = await fetch(`https://api.telegram.org/bot${this.telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.telegramChatId,
          text: message,
          parse_mode: 'Markdown'
        })
      });

      if (response.ok) {
        alert('Results sent to Telegram successfully!');
      } else {
        throw new Error('Failed to send');
      }
    } catch (error) {
      console.error('Telegram error:', error);
      alert('Failed to send to Telegram. Please check your settings.');
    }
  },

  /**
   * Text-to-Speech
   */
  speak(text) {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }
  },

  /**
   * Save progress to localStorage
   */
  saveProgress() {
    const progress = {
      unit: this.currentUnit,
      score: this.score,
      accuracy: Math.round((this.correctAnswers / this.totalQuestions) * 100),
      timestamp: Date.now()
    };

    const allProgress = JSON.parse(localStorage.getItem('englishLearningProgress') || '{}');
    allProgress[`unit-${this.currentUnit}`] = progress;
    localStorage.setItem('englishLearningProgress', JSON.stringify(allProgress));
  },

  /**
   * Load progress from localStorage
   */
  loadProgress() {
    const allProgress = JSON.parse(localStorage.getItem('englishLearningProgress') || '{}');
    return allProgress;
  },

  /**
   * Configure Telegram
   */
  configureTelegram(botToken, chatId, studentName) {
    this.telegramBotToken = botToken;
    this.telegramChatId = chatId;
    this.studentName = studentName;
    localStorage.setItem('telegramConfig', JSON.stringify({ botToken, chatId, studentName }));
  },

  /**
   * Load Telegram config
   */
  loadTelegramConfig() {
    const config = JSON.parse(localStorage.getItem('telegramConfig') || '{}');
    if (config.botToken) {
      this.telegramBotToken = config.botToken;
      this.telegramChatId = config.chatId;
      this.studentName = config.studentName;
    }
  }
};

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  GameEngine.loadTelegramConfig();
  GameEngine.init();
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameEngine;
}
