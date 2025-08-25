import { describe, it, expect, beforeEach, vi } from 'vitest';
import { App } from '@/App';

// Mock services
vi.mock('@services/ContentService', () => ({
  contentService: {
    getContentIndex: vi.fn(() => ({})),
    loadLesson: vi.fn(),
  },
}));

vi.mock('@services/ContentProcessor', () => ({
  contentProcessor: {},
}));

vi.mock('@services/AudioService', () => ({
  audioService: {},
}));

vi.mock('@services/AIService', () => ({
  aiService: {
    saveConfig: vi.fn(),
  },
}));

vi.mock('@components/ContentAdder/ContentAdder', () => ({
  ContentAdder: vi.fn().mockImplementation(() => ({
    element: document.createElement('div'),
    open: vi.fn(),
  })),
}));

describe('App Component', () => {
  let app: App;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    
    // Mock localStorage
    localStorage.clear();
    
    app = new App();
  });

  describe('Initialization', () => {
    it('should create app element with correct structure', () => {
      const element = app.getElement();
      
      expect(element.className).toBe('app');
      expect(element.id).toBe('main-content');
      expect(element.querySelector('.app-header')).toBeTruthy();
      expect(element.querySelector('.app-main')).toBeTruthy();
    });

    it('should render header with logo and actions', () => {
      const element = app.getElement();
      
      expect(element.querySelector('.app-logo__text')?.textContent).toBe('English Learning Dashboard');
      expect(element.querySelector('.add-content-btn')).toBeTruthy();
      expect(element.querySelector('.create-quiz-btn')).toBeTruthy();
      expect(element.querySelector('.settings-btn')).toBeTruthy();
    });

    it('should default to dashboard view', () => {
      const element = app.getElement();
      const dashboardView = element.querySelector('[data-view="dashboard"]');
      const lessonView = element.querySelector('[data-view="lesson"]');
      
      expect(dashboardView?.classList.contains('hidden')).toBe(false);
      expect(lessonView?.classList.contains('hidden')).toBe(true);
    });
  });

  describe('Navigation', () => {
    it('should switch to quiz view when create quiz button is clicked', () => {
      app.render(container);
      const element = app.getElement();
      const createQuizBtn = element.querySelector('.create-quiz-btn') as HTMLButtonElement;
      
      createQuizBtn.click();
      
      const dashboardView = element.querySelector('[data-view="dashboard"]');
      const quizView = element.querySelector('[data-view="quiz"]');
      
      expect(dashboardView?.classList.contains('hidden')).toBe(true);
      expect(quizView?.classList.contains('hidden')).toBe(false);
    });

    it('should switch to settings view when settings button is clicked', () => {
      app.render(container);
      const element = app.getElement();
      const settingsBtn = element.querySelector('.settings-btn') as HTMLButtonElement;
      
      settingsBtn.click();
      
      const dashboardView = element.querySelector('[data-view="dashboard"]');
      const settingsView = element.querySelector('[data-view="settings"]');
      
      expect(dashboardView?.classList.contains('hidden')).toBe(true);
      expect(settingsView?.classList.contains('hidden')).toBe(false);
    });

    it('should return to dashboard when back button is clicked', () => {
      app.render(container);
      const element = app.getElement();
      
      // Go to settings first
      const settingsBtn = element.querySelector('.settings-btn') as HTMLButtonElement;
      settingsBtn.click();
      
      // Click back button
      const backBtn = element.querySelector('.settings-view .back-btn') as HTMLButtonElement;
      backBtn.click();
      
      const dashboardView = element.querySelector('[data-view="dashboard"]');
      const settingsView = element.querySelector('[data-view="settings"]');
      
      expect(dashboardView?.classList.contains('hidden')).toBe(false);
      expect(settingsView?.classList.contains('hidden')).toBe(true);
    });
  });

  describe('Dashboard Content', () => {
    it('should render grades grid', () => {
      const element = app.getElement();
      const gradesGrid = element.querySelector('.grades-grid');
      
      expect(gradesGrid).toBeTruthy();
      // Should have grade cards for grades 6-12
      expect(gradesGrid?.innerHTML).toContain('Grade 6');
      expect(gradesGrid?.innerHTML).toContain('Grade 12');
    });

    it('should render empty active quizzes when no quizzes exist', () => {
      const element = app.getElement();
      const activeQuizzes = element.querySelector('.active-quizzes');
      
      expect(activeQuizzes?.innerHTML).toContain('No active quizzes');
    });

    it('should render recent vocabulary section', () => {
      const element = app.getElement();
      const recentVocab = element.querySelector('.recent-vocabulary');
      
      expect(recentVocab).toBeTruthy();
      // Should show mock vocabulary data
      expect(recentVocab?.innerHTML).toContain('Grade 7');
      expect(recentVocab?.innerHTML).toContain('hobby');
    });

    it('should render recent activity section', () => {
      const element = app.getElement();
      const recentActivity = element.querySelector('.recent-activity');
      
      expect(recentActivity).toBeTruthy();
      // Initially should be empty
      expect(recentActivity?.innerHTML).toContain('No recent activity');
    });
  });

  describe('Settings Management', () => {
    it('should have settings form elements in settings view', () => {
      app.render(container);
      const element = app.getElement();
      
      const settingsBtn = element.querySelector('.settings-btn') as HTMLButtonElement;
      settingsBtn.click();
      
      // Check that settings form elements exist
      const providerSelect = element.querySelector('.ai-provider') as HTMLSelectElement;
      const apiKeyInput = element.querySelector('.ai-api-key') as HTMLInputElement;
      const saveBtn = element.querySelector('.save-ai-settings') as HTMLButtonElement;
      
      expect(providerSelect).toBeTruthy();
      expect(apiKeyInput).toBeTruthy();
      expect(saveBtn).toBeTruthy();
      
      // Check default values
      expect(providerSelect?.value).toBe('none');
      expect(apiKeyInput?.value).toBe('');
    });

    it('should save AI settings when save button is clicked', () => {
      app.render(container);
      const element = app.getElement();
      
      // Go to settings
      const settingsBtn = element.querySelector('.settings-btn') as HTMLButtonElement;
      settingsBtn.click();
      
      // Set values
      const providerSelect = element.querySelector('.ai-provider') as HTMLSelectElement;
      const apiKeyInput = element.querySelector('.ai-api-key') as HTMLInputElement;
      providerSelect.value = 'gemini';
      apiKeyInput.value = 'new-key';
      
      // Mock alert
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      
      // Click save
      const saveBtn = element.querySelector('.save-ai-settings') as HTMLButtonElement;
      saveBtn.click();
      
      expect(alertSpy).toHaveBeenCalledWith('AI settings saved successfully!');
      alertSpy.mockRestore();
    });
  });
});