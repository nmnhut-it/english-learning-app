/**
 * Vocabulary Helper UI Component
 * Provides interactive vocabulary support for students during exercises
 */

const VocabularyHelper = {
  currentUnitId: null,
  vocabularyData: null,
  isOpen: false,
  containerElement: null,

  /**
   * Initialize the vocabulary helper
   * @param {string} unitId - Current unit ID
   */
  async init(unitId) {
    this.currentUnitId = unitId;
    await this.loadVocabulary(unitId);
    this.createUI();
  },

  /**
   * Load vocabulary data from JSON file
   * @param {string} unitId - Unit ID to load
   */
  async loadVocabulary(unitId) {
    try {
      const response = await fetch(`../data/vocabulary/${unitId}.json`);
      if (!response.ok) {
        console.warn(`Vocabulary file not found for ${unitId}`);
        return;
      }
      const data = await response.json();
      this.vocabularyData = data.vocabularyData;
    } catch (error) {
      console.error('Error loading vocabulary:', error);
    }
  },

  /**
   * Create the vocabulary helper UI
   */
  createUI() {
    if (!this.vocabularyData) return;

    // Create toggle button
    const toggleBtn = Utils.createElement('button', {
      class: 'vocab-helper-toggle',
      type: 'button',
      'aria-label': 'Open Vocabulary Helper'
    }, '📚 Vocabulary');

    toggleBtn.onclick = () => this.toggle();

    // Create container
    this.containerElement = Utils.createElement('div', {
      class: 'vocab-helper-panel',
      id: 'vocab-helper-panel'
    });

    this.containerElement.style.display = 'none';

    // Add to body
    document.body.appendChild(toggleBtn);
    document.body.appendChild(this.containerElement);
  },

  /**
   * Toggle vocabulary panel open/close
   */
  toggle() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.open();
    } else {
      this.close();
    }
  },

  /**
   * Open vocabulary panel
   */
  open() {
    if (!this.vocabularyData) return;

    this.isOpen = true;
    this.containerElement.style.display = 'block';
    this.renderContent();

    // Add animation class
    setTimeout(() => {
      this.containerElement.classList.add('vocab-helper-panel--open');
    }, 10);
  },

  /**
   * Close vocabulary panel
   */
  close() {
    this.isOpen = false;
    this.containerElement.classList.remove('vocab-helper-panel--open');

    // Wait for animation before hiding
    setTimeout(() => {
      this.containerElement.style.display = 'none';
    }, 300);
  },

  /**
   * Render vocabulary content
   */
  renderContent() {
    const { grammarTerms, difficultWords, keyPhrases, phrasalVerbs, usefulExpressions } = this.vocabularyData;

    let html = `
      <div class="vocab-helper-header">
        <h3>📚 Vocabulary Helper</h3>
        <button class="vocab-helper-close" onclick="VocabularyHelper.close()">✕</button>
      </div>

      <div class="vocab-helper-search">
        <input type="text" id="vocab-search" class="input" placeholder="Search vocabulary..." />
      </div>

      <div class="vocab-helper-content">
    `;

    // Grammar Terms
    if (grammarTerms && grammarTerms.length > 0) {
      html += '<div class="vocab-section">';
      html += '<h4 class="vocab-section-title">📖 Grammar Terms</h4>';
      grammarTerms.forEach(term => {
        html += this.renderVocabItem(term);
      });
      html += '</div>';
    }

    // Difficult Words
    if (difficultWords && difficultWords.length > 0) {
      html += '<div class="vocab-section">';
      html += '<h4 class="vocab-section-title">💡 Difficult Words</h4>';
      difficultWords.forEach(word => {
        html += this.renderVocabItem(word);
      });
      html += '</div>';
    }

    // Key Phrases
    if (keyPhrases && keyPhrases.length > 0) {
      html += '<div class="vocab-section">';
      html += '<h4 class="vocab-section-title">🔑 Key Grammar Phrases</h4>';
      keyPhrases.forEach(phrase => {
        html += this.renderPhraseItem(phrase);
      });
      html += '</div>';
    }

    // Phrasal Verbs
    if (phrasalVerbs && phrasalVerbs.length > 0) {
      html += '<div class="vocab-section">';
      html += '<h4 class="vocab-section-title">🚀 Phrasal Verbs</h4>';
      phrasalVerbs.forEach(verb => {
        html += this.renderPhrasalVerbItem(verb);
      });
      html += '</div>';
    }

    // Useful Expressions
    if (usefulExpressions && usefulExpressions.length > 0) {
      html += '<div class="vocab-section">';
      html += '<h4 class="vocab-section-title">💬 Useful Expressions</h4>';
      usefulExpressions.forEach(expr => {
        html += this.renderExpressionItem(expr);
      });
      html += '</div>';
    }

    html += '</div>'; // Close vocab-helper-content

    this.containerElement.innerHTML = html;

    // Add search functionality
    const searchInput = document.getElementById('vocab-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => this.filterVocabulary(e.target.value));
    }
  },

  /**
   * Render a vocabulary item (word or term)
   * @param {Object} item - Vocabulary item
   * @returns {string} HTML string
   */
  renderVocabItem(item) {
    const difficultyClass = `difficulty-${item.difficulty || 'basic'}`;
    return `
      <div class="vocab-item ${difficultyClass}" data-word="${item.word.toLowerCase()}">
        <div class="vocab-item-word">
          <strong>${item.word}</strong>
          ${item.pronunciation ? `<span class="vocab-pronunciation">${item.pronunciation}</span>` : ''}
        </div>
        <div class="vocab-item-vietnamese">${item.vietnamese}</div>
        <div class="vocab-item-definition">${item.definition}</div>
        <div class="vocab-item-example"><em>${item.example}</em></div>
      </div>
    `;
  },

  /**
   * Render a phrase item
   * @param {Object} phrase - Phrase object
   * @returns {string} HTML string
   */
  renderPhraseItem(phrase) {
    return `
      <div class="vocab-item vocab-phrase" data-word="${(phrase.phrase || phrase.expression).toLowerCase()}">
        <div class="vocab-item-word">
          <strong>${phrase.phrase || phrase.expression}</strong>
        </div>
        <div class="vocab-item-vietnamese">${phrase.vietnamese}</div>
        ${phrase.structure ? `<div class="vocab-structure">Structure: ${phrase.structure}</div>` : ''}
        <div class="vocab-item-definition">${phrase.definition}</div>
        <div class="vocab-item-example"><em>${phrase.example}</em></div>
        ${phrase.usage ? `<div class="vocab-usage">💡 ${phrase.usage}</div>` : ''}
      </div>
    `;
  },

  /**
   * Render a phrasal verb item
   * @param {Object} verb - Phrasal verb object
   * @returns {string} HTML string
   */
  renderPhrasalVerbItem(verb) {
    return `
      <div class="vocab-item vocab-phrasal-verb" data-word="${verb.verb.toLowerCase()}">
        <div class="vocab-item-word">
          <strong>${verb.verb}</strong>
        </div>
        <div class="vocab-item-vietnamese">${verb.vietnamese}</div>
        <div class="vocab-item-definition">${verb.definition}</div>
        <div class="vocab-item-example"><em>${verb.example}</em></div>
        ${verb.synonyms ? `<div class="vocab-synonyms">Synonyms: ${verb.synonyms.join(', ')}</div>` : ''}
      </div>
    `;
  },

  /**
   * Render an expression item
   * @param {Object} expr - Expression object
   * @returns {string} HTML string
   */
  renderExpressionItem(expr) {
    return `
      <div class="vocab-item vocab-expression" data-word="${expr.expression.toLowerCase()}">
        <div class="vocab-item-word">
          <strong>${expr.expression}</strong>
        </div>
        <div class="vocab-item-vietnamese">${expr.vietnamese}</div>
        <div class="vocab-item-example"><em>${expr.example}</em></div>
        ${expr.type ? `<div class="vocab-type">Type: ${expr.type}</div>` : ''}
      </div>
    `;
  },

  /**
   * Filter vocabulary based on search query
   * @param {string} query - Search query
   */
  filterVocabulary(query) {
    const items = this.containerElement.querySelectorAll('.vocab-item');
    const searchTerm = query.toLowerCase().trim();

    items.forEach(item => {
      const word = item.dataset.word || '';
      const text = item.textContent.toLowerCase();

      if (searchTerm === '' || word.includes(searchTerm) || text.includes(searchTerm)) {
        item.style.display = 'block';
      } else {
        item.style.display = 'none';
      }
    });

    // Hide sections with no visible items
    const sections = this.containerElement.querySelectorAll('.vocab-section');
    sections.forEach(section => {
      const visibleItems = section.querySelectorAll('.vocab-item[style="display: block;"], .vocab-item:not([style*="display: none"])');
      if (searchTerm !== '' && visibleItems.length === 0) {
        section.style.display = 'none';
      } else {
        section.style.display = 'block';
      }
    });
  },

  /**
   * Show tooltip for a specific word
   * @param {string} word - Word to show tooltip for
   * @param {HTMLElement} element - Element to attach tooltip to
   */
  showTooltip(word, element) {
    if (!this.vocabularyData) return;

    // Search all vocabulary types for the word
    const allVocab = [
      ...(this.vocabularyData.grammarTerms || []),
      ...(this.vocabularyData.difficultWords || []),
    ];

    const found = allVocab.find(item =>
      item.word && item.word.toLowerCase() === word.toLowerCase()
    );

    if (found) {
      const tooltipContent = `
        <strong>${found.word}</strong><br>
        ${found.vietnamese}<br>
        <em>${found.example}</em>
      `;
      Utils.showTooltip(tooltipContent, element);
    }
  }
};

// Auto-initialize if running in browser
if (typeof window !== 'undefined') {
  window.VocabularyHelper = VocabularyHelper;
}
