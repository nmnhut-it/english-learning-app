/**
 * Sequence Order Exercise Handler
 * For dialogue/paragraph/letter ordering questions with drag-and-drop UI
 * Better UX than multiple-choice with letter sequences like "d-c-a-e-b"
 */

const SequenceOrderExercise = {
  /**
   * Render the sequence ordering UI
   * @param {Object} question - Question data with items to order
   * @param {HTMLElement} container - DOM element to render into
   * @param {Object} callbacks - { onAnswer, onHint }
   */
  render(question, container, callbacks) {
    const card = Utils.createElement('div', { class: 'card exercise-card sequence-order-card' });

    // Section badge if available
    if (question.section) {
      const sectionBadge = Utils.createElement('div', {
        class: 'exercise-section-badge'
      }, question.section);
      card.appendChild(sectionBadge);
    }

    // Question number and title
    const questionNum = Utils.createElement('div', { class: 'exercise-number' }, `Câu ${question.id}`);
    card.appendChild(questionNum);

    // Instructions
    const instructions = Utils.createElement('div', {
      class: 'sequence-order__instructions'
    }, question.instruction || 'Sắp xếp các mục theo thứ tự đúng:');
    card.appendChild(instructions);

    // Parse items from question text or items array
    const items = this.parseItems(question);

    // Create sortable container
    const sortableContainer = Utils.createElement('div', {
      class: 'sequence-order__container',
      id: `sortable-${question.id}`
    });

    // Shuffle items for display
    const shuffledItems = this.shuffleItems(items);

    shuffledItems.forEach((item, index) => {
      const itemElement = this.createSortableItem(item, index);
      sortableContainer.appendChild(itemElement);
    });

    card.appendChild(sortableContainer);

    // Initialize drag and drop
    this.initDragAndDrop(sortableContainer);

    // Action buttons
    const actionsDiv = Utils.createElement('div', { class: 'exercise-actions' });

    const submitBtn = Utils.createElement('button', {
      class: 'btn btn--primary',
      id: 'submit-sequence-btn'
    }, '✓ Kiểm tra');
    submitBtn.onclick = () => {
      const userOrder = this.getUserAnswer(container);
      callbacks.onAnswer(userOrder);
      submitBtn.disabled = true;
    };

    const hintBtn = Utils.createElement('button', {
      class: 'btn btn--secondary'
    }, '💡 Gợi ý');
    hintBtn.onclick = () => callbacks.onHint();

    actionsDiv.appendChild(hintBtn);
    actionsDiv.appendChild(submitBtn);
    card.appendChild(actionsDiv);

    container.appendChild(card);
  },

  /**
   * Parse items from question data
   * @param {Object} question - Question object
   * @returns {Array} - Array of { label, text } objects
   */
  parseItems(question) {
    // If question has items array directly
    if (question.items && Array.isArray(question.items)) {
      return question.items.map((item, index) => ({
        label: item.label || String.fromCharCode(97 + index), // a, b, c...
        text: item.text || item,
        originalIndex: index
      }));
    }

    // Parse from question text (format: "a. Text\nb. Text\n...")
    const questionText = question.question || '';
    const lines = questionText.split('\n').filter(line => line.trim());

    // Find lines that start with letter labels (a., b., c., etc.)
    const items = [];
    lines.forEach(line => {
      const match = line.match(/^([a-z])\.\s*(.+)/i);
      if (match) {
        items.push({
          label: match[1].toLowerCase(),
          text: match[2].trim(),
          originalIndex: items.length
        });
      }
    });

    return items;
  },

  /**
   * Shuffle items for initial display (but remember original order)
   * @param {Array} items - Array of items
   * @returns {Array} - Shuffled array
   */
  shuffleItems(items) {
    // Check for test mode - don't shuffle
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('test') === 'true') {
      return [...items];
    }
    return Utils.shuffleArray([...items]);
  },

  /**
   * Create a sortable item element
   * @param {Object} item - Item object with label and text
   * @param {number} index - Current index
   * @returns {HTMLElement} - Sortable item element
   */
  createSortableItem(item, index) {
    const itemDiv = Utils.createElement('div', {
      class: 'sequence-order__item',
      draggable: 'true',
      'data-label': item.label
    });

    // Position number (will update on reorder)
    const positionNum = Utils.createElement('span', {
      class: 'sequence-order__position'
    }, String(index + 1));

    // Label badge
    const labelBadge = Utils.createElement('span', {
      class: 'sequence-order__label'
    }, item.label.toUpperCase());

    // Text content
    const textSpan = Utils.createElement('span', {
      class: 'sequence-order__text'
    }, item.text);

    // Move buttons container
    const buttonsDiv = Utils.createElement('div', { class: 'sequence-order__buttons' });

    const upBtn = Utils.createElement('button', {
      class: 'sequence-order__move-btn',
      title: 'Di chuyển lên'
    }, '▲');
    upBtn.onclick = (e) => {
      e.stopPropagation();
      this.moveItem(itemDiv, -1);
    };

    const downBtn = Utils.createElement('button', {
      class: 'sequence-order__move-btn',
      title: 'Di chuyển xuống'
    }, '▼');
    downBtn.onclick = (e) => {
      e.stopPropagation();
      this.moveItem(itemDiv, 1);
    };

    buttonsDiv.appendChild(upBtn);
    buttonsDiv.appendChild(downBtn);

    // Drag handle
    const dragHandle = Utils.createElement('span', {
      class: 'sequence-order__drag-handle',
      title: 'Kéo để di chuyển'
    }, '⋮⋮');

    itemDiv.appendChild(positionNum);
    itemDiv.appendChild(labelBadge);
    itemDiv.appendChild(textSpan);
    itemDiv.appendChild(buttonsDiv);
    itemDiv.appendChild(dragHandle);

    return itemDiv;
  },

  /**
   * Move item up or down
   * @param {HTMLElement} item - Item element to move
   * @param {number} direction - -1 for up, 1 for down
   */
  moveItem(item, direction) {
    const container = item.parentElement;
    const items = Array.from(container.children);
    const currentIndex = items.indexOf(item);
    const newIndex = currentIndex + direction;

    if (newIndex < 0 || newIndex >= items.length) return;

    if (direction === -1) {
      container.insertBefore(item, items[newIndex]);
    } else {
      container.insertBefore(item, items[newIndex].nextSibling);
    }

    this.updatePositionNumbers(container);
  },

  /**
   * Update position numbers after reordering
   * @param {HTMLElement} container - Sortable container
   */
  updatePositionNumbers(container) {
    const items = container.querySelectorAll('.sequence-order__item');
    items.forEach((item, index) => {
      const posNum = item.querySelector('.sequence-order__position');
      if (posNum) {
        posNum.textContent = String(index + 1);
      }
    });
  },

  /**
   * Initialize drag and drop functionality
   * @param {HTMLElement} container - Sortable container
   */
  initDragAndDrop(container) {
    let draggedItem = null;

    container.addEventListener('dragstart', (e) => {
      if (e.target.classList.contains('sequence-order__item')) {
        draggedItem = e.target;
        e.target.classList.add('sequence-order__item--dragging');
        e.dataTransfer.effectAllowed = 'move';
      }
    });

    container.addEventListener('dragend', (e) => {
      if (e.target.classList.contains('sequence-order__item')) {
        e.target.classList.remove('sequence-order__item--dragging');
        draggedItem = null;
        this.updatePositionNumbers(container);
      }
    });

    container.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';

      const afterElement = this.getDragAfterElement(container, e.clientY);
      if (draggedItem) {
        if (afterElement == null) {
          container.appendChild(draggedItem);
        } else {
          container.insertBefore(draggedItem, afterElement);
        }
      }
    });
  },

  /**
   * Get element to insert after during drag
   * @param {HTMLElement} container - Container element
   * @param {number} y - Mouse Y position
   * @returns {HTMLElement|null} - Element to insert before, or null for end
   */
  getDragAfterElement(container, y) {
    const draggableElements = [
      ...container.querySelectorAll('.sequence-order__item:not(.sequence-order__item--dragging)')
    ];

    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;

      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  },

  /**
   * Get user's current answer (ordered labels)
   * @param {HTMLElement} container - Exercise container
   * @returns {string} - Answer in format "d-c-a-e-b"
   */
  getUserAnswer(container) {
    const sortableContainer = container.querySelector('.sequence-order__container');
    if (!sortableContainer) return '';

    const items = sortableContainer.querySelectorAll('.sequence-order__item');
    const labels = Array.from(items).map(item => item.dataset.label);
    return labels.join('-');
  },

  /**
   * Validate user answer
   * @param {string} userAnswer - User's ordered labels (e.g., "d-c-a-e-b")
   * @param {Object} question - Question data with correct answer
   * @returns {boolean} - True if correct
   */
  validate(userAnswer, question) {
    const correctAnswer = this.getCorrectAnswer(question);
    return Utils.normalizeText(userAnswer) === Utils.normalizeText(correctAnswer);
  },

  /**
   * Get correct answer from question
   * @param {Object} question - Question object
   * @returns {string} - Correct answer sequence
   */
  getCorrectAnswer(question) {
    // Check various possible field names
    if (question.correctOrder) return question.correctOrder;
    if (question.answer) return question.answer;

    // If correctIndex points to options array
    if (question.options && typeof question.correctIndex === 'number') {
      return question.options[question.correctIndex];
    }

    return '';
  },

  /**
   * Show feedback for correct/wrong answer
   * @param {HTMLElement} container - Exercise container
   * @param {boolean} isCorrect - Whether answer was correct
   * @param {Object} question - Question data
   */
  showFeedback(container, isCorrect, question) {
    const sortableContainer = container.querySelector('.sequence-order__container');
    if (!sortableContainer) return;

    // Add feedback class
    sortableContainer.classList.add(
      isCorrect ? 'sequence-order__container--correct' : 'sequence-order__container--wrong'
    );

    // Show correct answer if wrong
    if (!isCorrect) {
      const correctAnswer = this.getCorrectAnswer(question);
      const feedbackDiv = Utils.createElement('div', {
        class: 'sequence-order__feedback sequence-order__feedback--wrong'
      });
      feedbackDiv.innerHTML = `
        <strong>Đáp án đúng:</strong> ${correctAnswer.toUpperCase().replace(/-/g, ' → ')}
        ${question.explanation ? `<br><em>💡 ${question.explanation}</em>` : ''}
      `;
      sortableContainer.after(feedbackDiv);

      // Highlight correct order
      const correctLabels = correctAnswer.split('-');
      const items = sortableContainer.querySelectorAll('.sequence-order__item');
      items.forEach(item => {
        const label = item.dataset.label;
        const correctPosition = correctLabels.indexOf(label) + 1;
        const positionSpan = item.querySelector('.sequence-order__position');
        if (positionSpan) {
          positionSpan.innerHTML = `${positionSpan.textContent} <small>(→${correctPosition})</small>`;
        }
      });
    } else {
      const feedbackDiv = Utils.createElement('div', {
        class: 'sequence-order__feedback sequence-order__feedback--correct'
      });
      feedbackDiv.innerHTML = `✓ Chính xác! ${question.explanation ? `<em>💡 ${question.explanation}</em>` : ''}`;
      sortableContainer.after(feedbackDiv);
    }

    // Disable further interaction
    sortableContainer.querySelectorAll('.sequence-order__item').forEach(item => {
      item.draggable = false;
      item.querySelector('.sequence-order__buttons')?.remove();
    });
  },

  /**
   * Reset exercise
   * @param {HTMLElement} container - Exercise container
   */
  reset(container) {
    const sortableContainer = container.querySelector('.sequence-order__container');
    if (sortableContainer) {
      sortableContainer.classList.remove(
        'sequence-order__container--correct',
        'sequence-order__container--wrong'
      );
    }

    const feedback = container.querySelector('.sequence-order__feedback');
    if (feedback) feedback.remove();
  }
};

// Register with GameEngine
if (typeof GameEngine !== 'undefined') {
  GameEngine.registerExerciseHandler('sequence-order', SequenceOrderExercise);
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SequenceOrderExercise;
}
