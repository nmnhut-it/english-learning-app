import { Component } from '@components/core/Component';
import { MarkdownViewer } from '@components/MarkdownViewer/MarkdownViewer';
import { VocabularyCard } from '@components/VocabularyCard/VocabularyCard';
import { QuizGenerator } from '@components/QuizGenerator/QuizGenerator';
import { contentService } from '@services/ContentService';
import { audioService } from '@services/AudioService';
import type { Unit, VocabularyItem, Exercise, ComponentProps } from '@/types';

/**
 * Main Application Component
 * Framework-less vanilla TypeScript implementation
 */
export class App extends Component<ComponentProps> {
      private currentUnit: Unit | null = null;
  private selectedVocabulary: Set<VocabularyItem> = new Set();
  private currentView: 'content' | 'vocabulary' | 'quiz' | 'recent' = 'content';
  private markdownViewer: MarkdownViewer | null = null;
  private vocabularyCards: VocabularyCard[] = [];
  private quizGenerator: QuizGenerator | null = null;

  constructor() {
        super({});
    this.loadDefaultContent();
  }

  protected createElement(): HTMLElement {
        const app = document.createElement('div');
    app.className = 'app';
    app.id = 'main-content';
    
    app.innerHTML = `
      <header class=\"app-header\">
        <div class=\"app-header__content\">
          <div class=\"app-logo\">
            <span class=\"app-logo__icon\">📚</span>
            <h1 class=\"app-logo__text\">English Learning V2</h1>
          </div>
          
          <nav class=\"app-nav\">
            <button class=\"nav-btn nav-btn--content active\" data-view=\"content\" type=\"button\">
              <span class=\"nav-btn__icon\">📖</span>
              <span class=\"nav-btn__text\">Content</span>
            </button>
            <button class=\"nav-btn nav-btn--vocabulary\" data-view=\"vocabulary\" type=\"button\">
              <span class=\"nav-btn__icon\">📝</span>
              <span class=\"nav-btn__text\">Vocabulary</span>
              <span class=\"nav-btn__badge\">${this.selectedVocabulary.size}</span>
            </button>
            <button class=\"nav-btn nav-btn--quiz\" data-view=\"quiz\" type=\"button\">
              <span class=\"nav-btn__icon\">🎯</span>
              <span class=\"nav-btn__text\">Quiz</span>
            </button>
            <button class=\"nav-btn nav-btn--recent\" data-view=\"recent\" type=\"button\">
              <span class=\"nav-btn__icon\">⏱️</span>
              <span class=\"nav-btn__text\">Recent</span>
            </button>
          </nav>
          
          <div class=\"app-actions\">
            <button class=\"action-btn search-btn\" type=\"button\" aria-label=\"Search\">
              <span class=\"action-btn__icon\">🔍</span>
            </button>
            <button class=\"action-btn settings-btn\" type=\"button\" aria-label=\"Settings\">
              <span class=\"action-btn__icon\">⚙️</span>
            </button>
          </div>
        </div>
      </header>
      
      <main class=\"app-main\">
        <div class=\"app-content\">
          <div class=\"content-view\" data-view=\"content\">
            <div class=\"content-header\">
              <div class=\"unit-selector\">
                <select class=\"unit-select\" aria-label=\"Select unit\">
                  <option value=\"\">Select a unit...</option>
                  <option value=\"7-unit-01\">Grade 7 - Unit 1: Hobbies</option>
                  <option value=\"7-unit-02\">Grade 7 - Unit 2: Healthy Living</option>
                  <option value=\"8-unit-01\">Grade 8 - Unit 1: Leisure Activities</option>
                </select>
                <button class=\"load-btn\" type=\"button\">Load Unit</button>
              </div>
              
              <div class=\"content-status\">
                <span class=\"status-text\">Ready</span>
                <div class=\"loading-indicator hidden\">
                  <span class=\"loading-spinner\"></span>
                  <span class=\"loading-text\">Loading...</span>
                </div>
              </div>
            </div>
            
            <div class=\"markdown-container\">
              <!-- MarkdownViewer will be rendered here -->
            </div>
          </div>
          
          <div class=\"vocabulary-view hidden\" data-view=\"vocabulary\">
            <div class=\"vocabulary-header\">
              <h2 class=\"vocabulary-title\">
                Selected Vocabulary 
                <span class=\"vocabulary-count\">(${this.selectedVocabulary.size})</span>
              </h2>
              <div class=\"vocabulary-actions\">
                <button class=\"vocab-action-btn play-all-btn\" type=\"button\">
                  <span class=\"btn-icon\">🔊</span>
                  Play All
                </button>
                <button class=\"vocab-action-btn clear-btn\" type=\"button\">
                  <span class=\"btn-icon\">🗑️</span>
                  Clear All
                </button>
                <button class=\"vocab-action-btn export-btn\" type=\"button\">
                  <span class=\"btn-icon\">💾</span>
                  Export
                </button>
              </div>
            </div>
            
            <div class=\"vocabulary-grid\">
              <!-- VocabularyCards will be rendered here -->
            </div>
            
            <div class=\"vocabulary-empty ${this.selectedVocabulary.size > 0 ? 'hidden' : ''}\">
              <div class=\"empty-state\">
                <span class=\"empty-icon\">📝</span>
                <h3 class=\"empty-title\">No Vocabulary Selected</h3>
                <p class=\"empty-text\">Click on vocabulary words in the content to add them here.</p>
              </div>
            </div>
          </div>
          
          <div class=\"quiz-view hidden\" data-view=\"quiz\">
            <div class=\"quiz-header\">
              <h2 class=\"quiz-title\">Create Quiz</h2>
              <div class=\"quiz-options\">
                <label class=\"quiz-option\">
                  <span class=\"option-label\">Max Questions:</span>
                  <input type=\"number\" class=\"option-input max-questions\" value=\"10\" min=\"1\" max=\"50\">
                </label>
                <label class=\"quiz-option\">
                  <span class=\"option-label\">Time Limit (minutes):</span>
                  <input type=\"number\" class=\"option-input time-limit\" value=\"15\" min=\"5\" max=\"120\">
                </label>
                <button class=\"quiz-start-btn\" type=\"button\">Start Quiz</button>
              </div>
            </div>
            
            <div class=\"quiz-container\">
              <!-- QuizGenerator will be rendered here -->
            </div>
            
            <div class=\"quiz-empty ${this.currentUnit ? 'hidden' : ''}\">
              <div class=\"empty-state\">
                <span class=\"empty-icon\">🎯</span>
                <h3 class=\"empty-title\">No Content Loaded</h3>
                <p class=\"empty-text\">Load a unit first to create quizzes.</p>
              </div>
            </div>
          </div>
          
          <div class=\"recent-view hidden\" data-view=\"recent\">
            <div class=\"recent-header\">
              <h2 class=\"recent-title\">Recent Lessons</h2>
              <button class=\"clear-history-btn\" type=\"button\">Clear History</button>
            </div>
            
            <div class=\"recent-list\">
              <!-- Recent lessons will be rendered here -->
            </div>
            
            <div class=\"recent-empty\">
              <div class=\"empty-state\">
                <span class=\"empty-icon\">⏱️</span>
                <h3 class=\"empty-title\">No Recent Activity</h3>
                <p class=\"empty-text\">Your recently viewed lessons will appear here.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <footer class=\"app-footer\">
        <div class=\"app-footer__content\">
          <p class=\"footer-text\">
            English Learning App V2 - Framework-free vanilla TypeScript
          </p>
          <div class=\"footer-links\">
            <a href=\"#\" class=\"footer-link\">Help</a>
            <a href=\"#\" class=\"footer-link\">About</a>
          </div>
        </div>
      </footer>
    `;

    return app;
  }

  protected bindEvents(): void {
        // Navigation
    const navButtons = this.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
          btn.addEventListener('click', () => {
            const view = btn.getAttribute('data-view') as typeof this.currentView;
        if (view) {
              this.switchView(view);
        }
      });
    });

    // Unit loading
    const unitSelect = this.querySelector('.unit-select') as HTMLSelectElement;
    const loadBtn = this.querySelector('.load-btn');
    
    loadBtn?.addEventListener('click', () => {
          if (unitSelect.value) {
            this.loadUnit(unitSelect.value);
      }
    });

    unitSelect?.addEventListener('change', () => {
          if (unitSelect.value) {
            this.loadUnit(unitSelect.value);
      }
    });

    // Vocabulary actions
    const playAllBtn = this.querySelector('.play-all-btn');
    const clearBtn = this.querySelector('.clear-btn');
    const exportBtn = this.querySelector('.export-btn');

    playAllBtn?.addEventListener('click', () => this.playAllVocabulary());
    clearBtn?.addEventListener('click', () => this.clearVocabulary());
    exportBtn?.addEventListener('click', () => this.exportVocabulary());

    // Quiz actions
    const quizStartBtn = this.querySelector('.quiz-start-btn');
    quizStartBtn?.addEventListener('click', () => this.startQuiz());

    // Search functionality
    const searchBtn = this.querySelector('.search-btn');
    searchBtn?.addEventListener('click', () => this.openSearch());

    // Global event listeners
    this.eventBus.on('vocabulary-click', (vocab) => {
          this.addVocabulary(vocab);
    });

    this.eventBus.on('quiz-complete', (results) => {
          this.handleQuizComplete(results);
    });

    // Keyboard shortcuts
    this.addEventListener('keydown', (e) => {
          if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
              case '1': this.switchView('content'); break;
          case '2': this.switchView('vocabulary'); break;
          case '3': this.switchView('quiz'); break;
          case '4': this.switchView('recent'); break;
        }
      }
    });
  }

  /**
   * Switch between different views
   */
  private switchView(view: typeof this.currentView): void {
        this.currentView = view;
    
    // Update navigation
    const navButtons = this.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
          btn.classList.toggle('active', btn.getAttribute('data-view') === view);
    });
    
    // Update content visibility
    const viewElements = this.querySelectorAll('[data-view]');
    viewElements.forEach(el => {
          const element = el as HTMLElement;
      element.classList.toggle('hidden', element.getAttribute('data-view') !== view);
    });
    
    // Update vocabulary badge
    this.updateVocabularyBadge();
  }

  /**
   * Load a unit by ID
   */
  private async loadUnit(unitId: string): Promise<void> {
        const [grade, unit] = unitId.split('-');
    const loadingIndicator = this.querySelector('.loading-indicator');
    const statusText = this.querySelector('.status-text');
    
    try {
          // Show loading
      loadingIndicator?.classList.remove('hidden');
      if (statusText) statusText.textContent = 'Loading...';
      
      // Load unit data
      const unitData = await contentService.loadUnit(parseInt(grade), unit);
      this.currentUnit = unitData;
      
      // Create sample markdown content
      const markdownContent = this.generateMarkdownFromUnit(unitData);
      
      // Initialize or update markdown viewer
      if (this.markdownViewer) {
            this.markdownViewer.updateProps({ 
              content: markdownContent,
          currentUnit: unitData 
        });
      } else {
            this.createMarkdownViewer(markdownContent, unitData);
      }
      
      // Update status
      if (statusText) statusText.textContent = `Loaded: ${unitData.title}`;
      
      // Update quiz empty state
      const quizEmpty = this.querySelector('.quiz-empty');
      quizEmpty?.classList.add('hidden');
      
    } catch (error) {
          console.error('Failed to load unit:', error);
      if (statusText) statusText.textContent = 'Error loading unit';
      
      // Show error message
      this.showErrorMessage('Failed to load unit. Please try again.');
      
    } finally {
          loadingIndicator?.classList.add('hidden');
    }
  }

  /**
   * Create markdown viewer component
   */
  private createMarkdownViewer(content: string, unit: Unit): void {
        const container = this.querySelector('.markdown-container');
    if (!container) return;

    this.markdownViewer = new MarkdownViewer({
          content,
      currentUnit: unit,
      highlightVocabulary: true,
      onVocabularyClick: (vocab) => {
            this.addVocabulary(vocab);
      }
    });

    container.innerHTML = '';
    this.markdownViewer.render(container);
  }

  /**
   * Add vocabulary to selection
   */
  private addVocabulary(vocab: VocabularyItem): void {
        if (!this.selectedVocabulary.has(vocab)) {
          this.selectedVocabulary.add(vocab);
      this.updateVocabularyView();
      this.updateVocabularyBadge();
      
      // Show notification
      this.showNotification(`Added \"${vocab.word}\" to vocabulary list`);
    }
  }

  /**
   * Update vocabulary view
   */
  private updateVocabularyView(): void {
        const vocabularyGrid = this.querySelector('.vocabulary-grid');
    const vocabularyEmpty = this.querySelector('.vocabulary-empty');
    const vocabularyCount = this.querySelector('.vocabulary-count');
    
    if (!vocabularyGrid) return;

    // Clear existing cards
    this.vocabularyCards.forEach(card => card.destroy());
    this.vocabularyCards = [];
    vocabularyGrid.innerHTML = '';

    // Update count
    if (vocabularyCount) {
          vocabularyCount.textContent = `(${this.selectedVocabulary.size})`;
    }

    if (this.selectedVocabulary.size === 0) {
          vocabularyEmpty?.classList.remove('hidden');
      return;
    }

    vocabularyEmpty?.classList.add('hidden');

    // Create cards for selected vocabulary
    this.selectedVocabulary.forEach(vocab => {
          const card = new VocabularyCard({
            word: vocab,
        showTranslation: true,
        selected: true,
        onPronounce: (audioUrl) => {
              console.log('Playing pronunciation:', audioUrl);
        },
        onSelect: (word) => {
              this.selectedVocabulary.delete(word);
          this.updateVocabularyView();
          this.updateVocabularyBadge();
        }
      });

      card.render(vocabularyGrid);
      this.vocabularyCards.push(card);
    });
  }

  /**
   * Update vocabulary badge count
   */
  private updateVocabularyBadge(): void {
        const badge = this.querySelector('.nav-btn--vocabulary .nav-btn__badge');
    if (badge) {
          badge.textContent = this.selectedVocabulary.size.toString();
      badge.classList.toggle('hidden', this.selectedVocabulary.size === 0);
    }
  }

  /**
   * Play all vocabulary pronunciations
   */
  private async playAllVocabulary(): Promise<void> {
        const vocabularyArray = Array.from(this.selectedVocabulary);
    
    for (let i = 0; i < vocabularyArray.length; i++) {
          const vocab = vocabularyArray[i];
      try {
            await audioService.playPronunciation(
              vocab.word, 
          vocab.pronunciation.audio_files,
          true
        );
        
        // Pause between words
        if (i < vocabularyArray.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
            console.error('Failed to play pronunciation:', error);
      }
    }
  }

  /**
   * Clear all vocabulary
   */
  private clearVocabulary(): void {
        if (this.selectedVocabulary.size > 0) {
          const confirmed = confirm(`Clear all ${this.selectedVocabulary.size} vocabulary words?`);
      if (confirmed) {
            this.selectedVocabulary.clear();
        this.updateVocabularyView();
        this.updateVocabularyBadge();
        this.showNotification('Vocabulary list cleared');
      }
    }
  }

  /**
   * Export vocabulary
   */
  private exportVocabulary(): void {
        if (this.selectedVocabulary.size === 0) {
          this.showNotification('No vocabulary to export');
      return;
    }

    const vocabularyData = Array.from(this.selectedVocabulary).map(vocab => ({
          word: vocab.word,
      pronunciation: vocab.pronunciation.ipa,
      definition: vocab.definition,
      translation: vocab.translation,
      examples: vocab.examples.map(ex => ({
            text: ex.text,
        translation: ex.translation
      }))
    }));

    const dataStr = JSON.stringify(vocabularyData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `vocabulary-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    this.showNotification('Vocabulary exported successfully');
  }

  /**
   * Start quiz
   */
  private startQuiz(): void {
        if (!this.currentUnit) {
          this.showNotification('Please load a unit first');
      return;
    }

    const maxQuestions = (this.querySelector('.max-questions') as HTMLInputElement)?.value;
    const timeLimit = (this.querySelector('.time-limit') as HTMLInputElement)?.value;
    
    // Collect exercises from current unit
    const exercises: Exercise[] = [];
    this.currentUnit.sections.forEach(section => {
          exercises.push(...section.exercises);
    });

    if (exercises.length === 0) {
          this.showNotification('No exercises available in this unit');
      return;
    }

    // Create quiz
    const quizContainer = this.querySelector('.quiz-container');
    if (quizContainer) {
          this.quizGenerator = new QuizGenerator({
            exercises,
        maxQuestions: parseInt(maxQuestions) || 10,
        timeLimit: parseInt(timeLimit) || 15,
        onQuizComplete: (results) => {
              this.handleQuizComplete(results);
        }
      });

      quizContainer.innerHTML = '';
      this.quizGenerator.render(quizContainer);
    }
  }

  /**
   * Handle quiz completion
   */
  private handleQuizComplete(results: any): void {
        const message = `Quiz completed!\
Score: ${results.score}/${results.maxScore} (${results.percentage}%)\
Time: ${Math.round(results.timeSpent / 1000)}s`;
    
    alert(message);
    
    // Switch to results view or content view
    this.switchView('content');
  }

  /**
   * Open search functionality
   */
  private openSearch(): void {
        // Implementation for search modal/dropdown
    console.log('Search functionality not implemented yet');
  }

  /**
   * Load default content on app start
   */
  private async loadDefaultContent(): Promise<void> {
        // Load sample unit by default
    setTimeout(() => {
          const unitSelect = this.querySelector('.unit-select') as HTMLSelectElement;
      if (unitSelect) {
            unitSelect.value = '7-unit-01';
        this.loadUnit('7-unit-01');
      }
    }, 1000);
  }

  /**
   * Generate markdown content from unit data
   */
  private generateMarkdownFromUnit(unit: Unit): string {
        let markdown = `# ${unit.title}\
\
`;
    markdown += `${unit.metadata.description}\
\
`;
    
    // Add vocabulary section
    if (unit.vocabulary_bank.length > 0) {
          markdown += `## 📚 Vocabulary\
\
`;
      unit.vocabulary_bank.forEach(vocab => {
            markdown += `**${vocab.word}** /${vocab.pronunciation.ipa}/ - ${vocab.definition} (${vocab.translation})\
\
`;
      });
    }
    
    // Add sections
    unit.sections.forEach(section => {
          markdown += `## ${section.title}\
\
`;
      markdown += `${section.metadata.estimated_duration} minutes\
\
`;
      
      // Add exercises
      if (section.exercises.length > 0) {
            markdown += `### Exercises\
\
`;
        section.exercises.forEach((exercise, index) => {
              markdown += `${index + 1}. ${exercise.question.text}\
`;
          markdown += `   *${exercise.question.translation}*\
\
`;
        });
      }
    });
    
    return markdown;
  }

  /**
   * Show notification message
   */
  private showNotification(message: string): void {
        // Simple notification implementation
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #2563eb;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
          notification.style.animation = 'slideOut 0.3s ease forwards';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  /**
   * Show error message
   */
  private showErrorMessage(message: string): void {
        // Simple error message implementation
    console.error(message);
    alert(message); // In production, would use a proper modal
  }

  /**
   * Cleanup on destroy
   */
  protected onDestroy(): void {
        this.markdownViewer?.destroy();
    this.vocabularyCards.forEach(card => card.destroy());
    this.quizGenerator?.destroy();
  }
}