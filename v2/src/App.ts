import { Component } from '@components/core/Component';
import { MarkdownViewer } from '@components/MarkdownViewer/MarkdownViewer';
import { VocabularyCard } from '@components/VocabularyCard/VocabularyCard';
import { QuizGenerator } from '@components/QuizGenerator/QuizGenerator';
import { contentService } from '@services/ContentService';
import { contentProcessor } from '@services/ContentProcessor';
import { audioService } from '@services/AudioService';
import { aiService } from '@services/AIService';
import { router } from '@utils/Router';
import type { Unit, VocabularyItem, Exercise, ComponentProps, Lesson, LessonType } from '@/types';

/**
 * Main Application Component - Teacher Dashboard
 * Framework-less vanilla TypeScript implementation
 */
export class App extends Component<ComponentProps> {
  private currentView: 'dashboard' | 'lesson' | 'quiz' | 'settings' = 'dashboard';
  private currentLesson: Lesson | null = null;
  private selectedVocabulary: Set<VocabularyItem> = new Set();
  private recentActivity: any[] = [];

  constructor() {
    super({});
    // Initialize arrays to prevent undefined errors
    this.recentActivity = [];
    this.loadRecentActivity();
    this.loadContentIndex();
  }

  protected createElement(): HTMLElement {
    const app = document.createElement('div');
    app.className = 'app';
    app.id = 'main-content';
    
    app.innerHTML = `
      <header class="app-header">
        <div class="app-header__content">
          <div class="app-logo">
            <span class="app-logo__icon">📚</span>
            <h1 class="app-logo__text">English Learning Dashboard</h1>
          </div>
          
          <div class="app-actions">
            <a href="/add-content" class="action-btn add-content-btn" aria-label="Add Content">
              <span>➕ Add Content</span>
            </a>
            <button class="action-btn create-quiz-btn" type="button" aria-label="Create Quiz">
              <span>📝 Create Quiz</span>
            </button>
            <button class="action-btn settings-btn" type="button" aria-label="Settings">
              <span>⚙️</span>
            </button>
          </div>
        </div>
      </header>
      
      <main class="app-main">
        <!-- Dashboard View -->
        <div class="dashboard-view" data-view="dashboard">
          <!-- Grades and Units Grid -->
          <section class="grades-section">
            <h2 class="section-title">📖 Grades & Units</h2>
            <div class="grades-grid">
              ${this.renderGradesGrid()}
            </div>
          </section>
          
          <!-- Active Quizzes -->
          <section class="quizzes-section">
            <h2 class="section-title">🎯 Active Quizzes (Trả Bài)</h2>
            <div class="active-quizzes">
              ${this.renderActiveQuizzes()}
            </div>
          </section>
          
          <!-- Recent Vocabulary by Grade -->
          <section class="vocabulary-section">
            <h2 class="section-title">📝 Recent Vocabulary</h2>
            <div class="recent-vocabulary">
              ${this.renderRecentVocabulary()}
            </div>
          </section>
          
          <!-- Recent Activity -->
          <section class="activity-section">
            <h2 class="section-title">⏱️ Recent Activity</h2>
            <div class="recent-activity">
              ${this.renderRecentActivity()}
            </div>
          </section>
        </div>
        
        <!-- Lesson View (hidden by default) -->
        <div class="lesson-view hidden" data-view="lesson">
          <div class="lesson-header">
            <button class="back-btn" type="button">← Back to Dashboard</button>
            <h2 class="lesson-title"></h2>
          </div>
          <div class="lesson-content"></div>
        </div>
        
        <!-- Quiz View (hidden by default) -->
        <div class="quiz-view hidden" data-view="quiz">
          <div class="quiz-header">
            <button class="back-btn" type="button">← Back to Dashboard</button>
            <h2 class="quiz-title">Create Quiz</h2>
          </div>
          <div class="quiz-content"></div>
        </div>
        
        <!-- Settings View (hidden by default) -->
        <div class="settings-view hidden" data-view="settings">
          <div class="settings-header">
            <button class="back-btn" type="button">← Back to Dashboard</button>
            <h2 class="settings-title">Settings</h2>
          </div>
          <div class="settings-content">
            <div class="setting-group">
              <h3>AI Configuration</h3>
              <div class="ai-settings">
                <label>
                  <span>AI Provider:</span>
                  <select class="ai-provider">
                    <option value="none">None</option>
                    <option value="claude">Claude (Anthropic)</option>
                    <option value="gemini">Gemini (Google)</option>
                  </select>
                </label>
                <label>
                  <span>API Key:</span>
                  <input type="password" class="ai-api-key" placeholder="Enter your API key">
                </label>
                <button class="save-ai-settings">Save AI Settings</button>
              </div>
            </div>
          </div>
        </div>
      </main>
    `;

    return app;
  }

  protected bindEvents(): void {

    // Create Quiz button
    const createQuizBtn = this.querySelector('.create-quiz-btn');
    createQuizBtn?.addEventListener('click', () => this.openQuizCreator());

    // Settings button
    const settingsBtn = this.querySelector('.settings-btn');
    settingsBtn?.addEventListener('click', () => this.openSettings());

    // Back buttons
    const backBtns = this.querySelectorAll('.back-btn');
    backBtns.forEach(btn => {
      btn.addEventListener('click', () => this.switchView('dashboard'));
    });

    // Bind grade/unit/lesson clicks
    this.bindLessonClicks();

    // AI Settings
    const saveAIBtn = this.querySelector('.save-ai-settings');
    saveAIBtn?.addEventListener('click', () => this.saveAISettings());
  }

  /**
   * Render grades grid
   */
  private renderGradesGrid(): string {
    const grades = [6, 7, 8, 9, 10, 11, 12];
    const contentIndex = contentService.getContentIndex();
    
    return grades.map(grade => {
      const units = contentIndex[grade] || {};
      const unitCount = Object.keys(units).length;
      
      return `
        <div class="grade-card" data-grade="${grade}">
          <h3 class="grade-title">Grade ${grade}</h3>
          <div class="units-list">
            ${this.renderUnitsForGrade(grade, units)}
          </div>
          <div class="grade-stats">
            <span>${unitCount} units</span>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Render units for a specific grade
   */
  private renderUnitsForGrade(grade: number, units: any): string {
    const maxUnits = 12;
    const unitsList = [];
    
    for (let i = 1; i <= maxUnits; i++) {
      const lessons = units[i] || [];
      const lessonCount = lessons.length;
      const isComplete = this.checkIfUnitComplete(grade, i);
      
      unitsList.push(`
        <div class="unit-item ${lessonCount > 0 ? 'has-content' : ''} ${isComplete ? 'complete' : ''}" 
             data-grade="${grade}" data-unit="${i}">
          <div class="unit-header">
            <span class="unit-name">Unit ${i}</span>
            ${lessonCount > 0 ? `<span class="lesson-count">${lessonCount} lessons</span>` : ''}
          </div>
          ${lessonCount > 0 ? this.renderLessonsForUnit(grade, i, lessons) : '<div class="no-content">No content yet</div>'}
        </div>
      `);
    }
    
    return unitsList.join('');
  }

  /**
   * Render lessons for a unit
   */
  private renderLessonsForUnit(grade: number, unit: number, lessons: string[]): string {
    const lessonTypes = grade >= 10 ? 
      ['getting_started', 'language', 'reading', 'listening', 'speaking', 'writing', 'communication_culture', 'looking_back'] :
      ['getting_started', 'closer_look_1', 'closer_look_2', 'communication', 'skills_1', 'skills_2', 'looking_back'];
    
    return `
      <div class="lessons-grid">
        ${lessonTypes.map(type => {
          const hasContent = lessons.includes(type);
          const title = this.getLessonTitle(type);
          
          return `
            <div class="lesson-item ${hasContent ? 'has-content' : 'empty'}" 
                 data-grade="${grade}" data-unit="${unit}" data-lesson="${type}">
              <span class="lesson-icon">${hasContent ? '✓' : '○'}</span>
              <span class="lesson-name">${title}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  /**
   * Get lesson title
   */
  private getLessonTitle(type: string): string {
    const titles: Record<string, string> = {
      'getting_started': 'Getting Started',
      'closer_look_1': 'A Closer Look 1',
      'closer_look_2': 'A Closer Look 2',
      'communication': 'Communication',
      'skills_1': 'Skills 1',
      'skills_2': 'Skills 2',
      'looking_back': 'Looking Back',
      'language': 'Language',
      'reading': 'Reading',
      'listening': 'Listening',
      'speaking': 'Speaking',
      'writing': 'Writing',
      'communication_culture': 'Comm & Culture'
    };
    return titles[type] || type;
  }

  /**
   * Check if unit is complete
   */
  private checkIfUnitComplete(grade: number, unit: number): boolean {
    const contentIndex = contentService.getContentIndex();
    const lessons = contentIndex[grade]?.[unit] || [];
    const requiredLessons = grade >= 10 ? 8 : 7;
    return lessons.length >= requiredLessons;
  }

  /**
   * Render active quizzes
   */
  private renderActiveQuizzes(): string {
    const quizzes = this.getActiveQuizzes() || [];
    
    if (quizzes.length === 0) {
      return '<div class="empty-state">No active quizzes. Create one to start!</div>';
    }
    
    return quizzes.map(quiz => `
      <div class="quiz-card">
        <h4>${quiz.title}</h4>
        <div class="quiz-stats">
          <span>${quiz.submitted}/${quiz.total} submitted</span>
          <span>Due: ${quiz.dueDate}</span>
        </div>
        <div class="quiz-actions">
          <button class="view-results-btn" data-quiz-id="${quiz.id}">View Results</button>
          <button class="download-btn" data-quiz-id="${quiz.id}">Download</button>
        </div>
      </div>
    `).join('');
  }

  /**
   * Render recent vocabulary
   */
  private renderRecentVocabulary(): string {
    const recentVocab = this.getRecentVocabulary() || [];
    
    if (recentVocab.length === 0) {
      return '<div class="empty-state">No recent vocabulary</div>';
    }
    
    return `
      <div class="vocab-by-grade">
        ${recentVocab.map(gradeVocab => `
          <div class="grade-vocab">
            <h4>Grade ${gradeVocab.grade}</h4>
            <div class="vocab-list">
              ${gradeVocab.words.map(word => `
                <span class="vocab-word" data-word="${word}">${word}</span>
              `).join(', ')}
            </div>
            <button class="play-all-btn" data-grade="${gradeVocab.grade}">🔊 Play All</button>
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * Render recent activity
   */
  private renderRecentActivity(): string {
    console.log('renderRecentActivity called, recentActivity:', this.recentActivity);
    if (!this.recentActivity || this.recentActivity.length === 0) {
      return '<div class="empty-state">No recent activity</div>';
    }
    
    return `
      <div class="activity-list">
        ${this.recentActivity.map(activity => `
          <div class="activity-item">
            <span class="activity-icon">${activity.icon}</span>
            <span class="activity-text">${activity.text}</span>
            <span class="activity-time">${activity.time}</span>
          </div>
        `).join('')}
      </div>
    `;
  }


  /**
   * Open quiz creator
   */
  private openQuizCreator(): void {
    this.switchView('quiz');
    // Initialize quiz creator
  }

  /**
   * Open settings
   */
  private openSettings(): void {
    this.switchView('settings');
    this.loadAISettings();
  }

  /**
   * Load AI settings
   */
  private loadAISettings(): void {
    const config = JSON.parse(localStorage.getItem('ai_config') || '{"provider":"none"}');
    const providerSelect = this.querySelector('.ai-provider') as HTMLSelectElement;
    const apiKeyInput = this.querySelector('.ai-api-key') as HTMLInputElement;
    
    if (providerSelect) providerSelect.value = config.provider;
    if (apiKeyInput) apiKeyInput.value = config.apiKey || '';
  }

  /**
   * Save AI settings
   */
  private saveAISettings(): void {
    const providerSelect = this.querySelector('.ai-provider') as HTMLSelectElement;
    const apiKeyInput = this.querySelector('.ai-api-key') as HTMLInputElement;
    
    const config = {
      provider: providerSelect.value as 'claude' | 'gemini' | 'none',
      apiKey: apiKeyInput.value
    };
    
    aiService.saveConfig(config);
    alert('AI settings saved successfully!');
  }

  /**
   * Switch between views
   */
  private switchView(view: typeof this.currentView): void {
    this.currentView = view;
    
    const views = this.querySelectorAll('[data-view]');
    views.forEach(el => {
      const element = el as HTMLElement;
      element.classList.toggle('hidden', element.getAttribute('data-view') !== view);
    });
  }

  /**
   * Bind lesson click events
   */
  private bindLessonClicks(): void {
    const lessonItems = this.querySelectorAll('.lesson-item.has-content');
    lessonItems.forEach(item => {
      item.addEventListener('click', async (e) => {
        const target = e.currentTarget as HTMLElement;
        const grade = parseInt(target.dataset.grade!);
        const unit = parseInt(target.dataset.unit!);
        const lesson = target.dataset.lesson!;
        
        await this.loadLesson(grade, unit, lesson);
      });
    });
  }

  /**
   * Load a specific lesson
   */
  private async loadLesson(grade: number, unit: number, lessonType: string): Promise<void> {
    try {
      const lesson = await contentService.loadLesson(
        grade,
        `unit-${unit.toString().padStart(2, '0')}`,
        lessonType
      );
      
      this.currentLesson = lesson;
      this.switchView('lesson');
      
      // Display lesson content
      const lessonTitle = this.querySelector('.lesson-title');
      const lessonContent = this.querySelector('.lesson-content');
      
      if (lessonTitle) {
        lessonTitle.textContent = `Grade ${grade} - Unit ${unit} - ${lesson.title}`;
      }
      
      if (lessonContent) {
        // Create markdown viewer for lesson
        const viewer = new MarkdownViewer({
          content: this.generateLessonMarkdown(lesson),
          currentUnit: null,
          highlightVocabulary: true,
          onVocabularyClick: (vocab) => {
            this.selectedVocabulary.add(vocab);
          }
        });
        
        lessonContent.innerHTML = '';
        viewer.render(lessonContent);
      }
    } catch (error) {
      console.error('Failed to load lesson:', error);
      alert('Failed to load lesson content');
    }
  }

  /**
   * Generate markdown from lesson
   */
  private generateLessonMarkdown(lesson: Lesson): string {
    let markdown = `# ${lesson.title}\n\n`;
    
    if (lesson.vocabulary_bank.length > 0) {
      markdown += `## Vocabulary\n\n`;
      lesson.vocabulary_bank.forEach(vocab => {
        markdown += `**${vocab.word}** - ${vocab.definition}\n\n`;
      });
    }
    
    if (lesson.exercises.length > 0) {
      markdown += `## Exercises\n\n`;
      lesson.exercises.forEach((ex, i) => {
        markdown += `${i + 1}. ${ex.question.text}\n\n`;
      });
    }
    
    return markdown;
  }

  /**
   * Load content index
   */
  private loadContentIndex(): void {
    // Content index is loaded from localStorage via contentService
    console.log('Content index loaded');
  }

  /**
   * Load recent activity
   */
  private loadRecentActivity(): void {
    console.log('loadRecentActivity called');
    try {
      const saved = localStorage.getItem('recent_activity');
      this.recentActivity = saved ? JSON.parse(saved) : [];
      console.log('recentActivity loaded:', this.recentActivity);
    } catch (error) {
      console.error('Error loading recent activity:', error);
      this.recentActivity = [];
    }
  }

  /**
   * Add activity
   */
  private addActivity(activity: any): void {
    this.recentActivity.unshift(activity);
    this.recentActivity = this.recentActivity.slice(0, 10); // Keep last 10
    localStorage.setItem('recent_activity', JSON.stringify(this.recentActivity));
    this.refreshDashboard();
  }

  /**
   * Refresh dashboard - called when returning from add content page
   */
  public refreshDashboard(): void {
    const gradesSection = this.querySelector('.grades-grid');
    const activitySection = this.querySelector('.recent-activity');
    
    if (gradesSection) {
      gradesSection.innerHTML = this.renderGradesGrid();
    }
    
    if (activitySection) {
      activitySection.innerHTML = this.renderRecentActivity();
    }
    
    this.bindLessonClicks();
  }

  /**
   * Get active quizzes (mock data for now)
   */
  private getActiveQuizzes(): any[] {
    return [];
  }

  /**
   * Get recent vocabulary (mock data for now)
   */
  private getRecentVocabulary(): any[] {
    return [
      { grade: 7, words: ['hobby', 'unusual', 'creativity', 'collection'] },
      { grade: 8, words: ['leisure', 'activity', 'sport', 'entertainment'] }
    ];
  }
}