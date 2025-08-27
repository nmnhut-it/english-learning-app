import { Component } from '@components/core/Component';
import { aiService } from '@services/AIService';
import { router } from '@utils/Router';
import type { ComponentProps, LessonType } from '@/types';

interface AddContentFormData {
  grade: number;
  unit: number;
  unitTitle: string;
  lesson: LessonType;
  content: string;
  source: 'loigiahay' | 'manual' | 'textbook';
  autoProcess: boolean;
}

/**
 * Add Content Page - Full page for adding new content
 */
export class AddContentPage extends Component<ComponentProps> {
  private formData: AddContentFormData = {
    grade: 7,
    unit: 1,
    unitTitle: '',
    lesson: 'getting_started' as LessonType,
    content: '',
    source: 'manual',
    autoProcess: true
  };

  private isProcessing = false;

  protected createElement(): HTMLElement {
    const page = document.createElement('div');
    page.className = 'add-content-page';
    
    page.innerHTML = `
      <div class="page-header">
        <div class="breadcrumb">
          <a href="/" class="breadcrumb-link">Dashboard</a>
          <span class="breadcrumb-separator">›</span>
          <span class="breadcrumb-current">Add Content</span>
        </div>
        <h1 class="page-title">Add New Content</h1>
      </div>

      <div class="page-content">
        <form class="content-form" id="add-content-form">
          <!-- Grade Selection -->
          <div class="form-section">
            <h2 class="form-section__title">📚 Select Grade</h2>
            <div class="grade-selector">
              ${[6, 7, 8, 9, 10, 11, 12].map(grade => `
                <label class="grade-option">
                  <input type="radio" name="grade" value="${grade}" ${grade === 7 ? 'checked' : ''}>
                  <span class="grade-label">Grade ${grade}</span>
                </label>
              `).join('')}
            </div>
          </div>

          <!-- Unit Information -->
          <div class="form-section">
            <h2 class="form-section__title">📖 Unit Information</h2>
            <div class="form-row">
              <div class="form-field">
                <label for="unit-number">Unit Number</label>
                <input type="number" id="unit-number" name="unit" min="1" max="12" value="1" required>
              </div>
              <div class="form-field">
                <label for="unit-title">Unit Title <span class="required">*</span></label>
                <input type="text" id="unit-title" name="unitTitle" 
                       placeholder="e.g., Hobbies, Healthy Living, Festivals" required>
              </div>
            </div>
          </div>

          <!-- Lesson Type -->
          <div class="form-section">
            <h2 class="form-section__title">📝 Lesson Type</h2>
            <div class="lesson-selector" id="lesson-selector">
              ${this.renderLessonOptions(7)}
            </div>
          </div>

          <!-- Content Source -->
          <div class="form-section">
            <h2 class="form-section__title">📋 Content Source</h2>
            <div class="source-selector">
              <label class="source-option">
                <input type="radio" name="source" value="loigiahay" checked>
                <span>Loigiahay (Web)</span>
              </label>
              <label class="source-option">
                <input type="radio" name="source" value="manual">
                <span>Manual Notes</span>
              </label>
              <label class="source-option">
                <input type="radio" name="source" value="textbook">
                <span>Textbook</span>
              </label>
            </div>
          </div>

          <!-- Content Input -->
          <div class="form-section">
            <h2 class="form-section__title">✍️ Content <span class="required">*</span></h2>
            <textarea 
              name="content"
              class="content-textarea" 
              placeholder="Paste your content here...
              
For Loigiahay: Copy the entire lesson content
For Manual Notes: Type or paste your teaching notes
For Textbook: Type or paste the textbook content"
              rows="15"
              required
            ></textarea>
            <div class="character-count">
              <span id="char-count">0</span> characters
            </div>
          </div>

          <!-- Processing Options -->
          <div class="form-section">
            <h2 class="form-section__title">⚙️ Processing Options</h2>
            <div class="processing-options">
              <label class="checkbox-option">
                <input type="checkbox" name="autoProcess" checked>
                <span>Auto-extract vocabulary with AI</span>
              </label>
              <label class="checkbox-option">
                <input type="checkbox" name="generateExercises" checked>
                <span>Generate exercises from content</span>
              </label>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="form-actions">
            <button type="button" class="btn btn--secondary" id="cancel-btn">
              Cancel
            </button>
            <button type="button" class="btn btn--primary" id="save-draft-btn">
              Save as Draft
            </button>
            <button type="submit" class="btn btn--success" id="process-btn">
              <span class="btn-text">Process & Save</span>
              <span class="processing-spinner hidden">⏳ Processing...</span>
            </button>
          </div>
        </form>

        <!-- Status Messages -->
        <div id="status-message" class="status-message hidden"></div>
      </div>
    `;

    return page;
  }

  protected bindEvents(): void {
    const form = this.querySelector('#add-content-form') as HTMLFormElement;
    
    // Form submission
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.processAndSave();
    });

    // Cancel button
    const cancelBtn = this.querySelector('#cancel-btn');
    cancelBtn?.addEventListener('click', () => {
      if (this.formData.content.trim() && !confirm('Are you sure? You have unsaved content.')) {
        return;
      }
      router.navigate('/');
    });

    // Save draft button
    const saveDraftBtn = this.querySelector('#save-draft-btn');
    saveDraftBtn?.addEventListener('click', () => this.saveDraft());

    // Grade selection
    const gradeInputs = this.querySelectorAll('input[name="grade"]');
    gradeInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        this.formData.grade = parseInt(target.value);
        this.updateLessonOptions();
      });
    });

    // Content textarea character count
    const contentTextarea = this.querySelector('textarea[name="content"]') as HTMLTextAreaElement;
    const charCount = this.querySelector('#char-count');
    
    contentTextarea?.addEventListener('input', (e) => {
      const target = e.target as HTMLTextAreaElement;
      this.formData.content = target.value;
      if (charCount) {
        charCount.textContent = target.value.length.toString();
      }
    });

    // Auto-save draft every 30 seconds
    setInterval(() => {
      if (this.formData.content.trim() && !this.isProcessing) {
        this.autoSaveDraft();
      }
    }, 30000);
  }

  private renderLessonOptions(grade: number): string {
    const lessons = grade >= 10 ? 
      [
        { value: 'getting_started', label: 'Getting Started' },
        { value: 'language', label: 'Language' },
        { value: 'reading', label: 'Reading' },
        { value: 'listening', label: 'Listening' },
        { value: 'speaking', label: 'Speaking' },
        { value: 'writing', label: 'Writing' },
        { value: 'communication_culture', label: 'Communication & Culture' },
        { value: 'looking_back', label: 'Looking Back' }
      ] : [
        { value: 'getting_started', label: 'Getting Started' },
        { value: 'closer_look_1', label: 'A Closer Look 1 (Vocabulary)' },
        { value: 'closer_look_2', label: 'A Closer Look 2 (Grammar)' },
        { value: 'communication', label: 'Communication' },
        { value: 'skills_1', label: 'Skills 1 (Reading & Speaking)' },
        { value: 'skills_2', label: 'Skills 2 (Listening & Writing)' },
        { value: 'looking_back', label: 'Looking Back' }
      ];

    return lessons.map(lesson => `
      <label class="lesson-option">
        <input type="radio" name="lesson" value="${lesson.value}" 
               ${lesson.value === 'getting_started' ? 'checked' : ''}>
        <span>${lesson.label}</span>
      </label>
    `).join('');
  }

  private updateLessonOptions(): void {
    const lessonSelector = this.querySelector('#lesson-selector');
    if (lessonSelector) {
      lessonSelector.innerHTML = this.renderLessonOptions(this.formData.grade);
      
      // Re-bind lesson selection events
      const lessonInputs = this.querySelectorAll('input[name="lesson"]');
      lessonInputs.forEach(input => {
        input.addEventListener('change', (e) => {
          const target = e.target as HTMLInputElement;
          this.formData.lesson = target.value as LessonType;
        });
      });
    }
  }

  private collectFormData(): void {
    const form = this.querySelector('#add-content-form') as HTMLFormElement;
    const formData = new FormData(form);
    
    this.formData = {
      grade: parseInt(formData.get('grade') as string),
      unit: parseInt(formData.get('unit') as string),
      unitTitle: formData.get('unitTitle') as string,
      lesson: formData.get('lesson') as LessonType,
      content: formData.get('content') as string,
      source: formData.get('source') as 'loigiahay' | 'manual' | 'textbook',
      autoProcess: formData.get('autoProcess') === 'on'
    };
  }

  private validateForm(): boolean {
    this.collectFormData();
    
    const errors: string[] = [];

    if (!this.formData.unitTitle.trim()) {
      errors.push('Unit title is required');
    }

    if (!this.formData.content.trim()) {
      errors.push('Content is required');
    }

    if (this.formData.unit < 1 || this.formData.unit > 12) {
      errors.push('Unit number must be between 1 and 12');
    }

    if (errors.length > 0) {
      this.showMessage(errors.join(', '), 'error');
      return false;
    }

    return true;
  }

  private async processAndSave(): Promise<void> {
    if (!this.validateForm()) return;
    if (this.isProcessing) return;

    try {
      this.isProcessing = true;
      this.updateProcessingState(true);
      this.showMessage('Processing content... This may take a minute.', 'info');

      const result = await aiService.processContent(
        this.formData.content,
        this.formData.grade,
        this.formData.unit,
        this.formData.lesson,
        this.formData.unitTitle,
        this.formData.source
      );

      if (result.success) {
        this.showMessage('✅ Content processed and saved successfully!', 'success');
        
        // Save to recent activity
        this.saveToRecentActivity();
        
        // Navigate back to dashboard after 2 seconds
        setTimeout(() => {
          router.navigate('/');
        }, 2000);
      } else {
        throw new Error(result.message || 'Processing failed');
      }
    } catch (error) {
      console.error('Failed to process content:', error);
      this.showMessage(`Failed to process content: ${error.message}`, 'error');
    } finally {
      this.isProcessing = false;
      this.updateProcessingState(false);
    }
  }

  private saveDraft(): void {
    if (!this.validateForm()) return;

    const draftKey = `draft_${this.formData.grade}_${this.formData.unit}_${this.formData.lesson}`;
    localStorage.setItem(draftKey, JSON.stringify({
      ...this.formData,
      savedAt: new Date().toISOString()
    }));

    this.showMessage('Draft saved successfully', 'success');
  }

  private autoSaveDraft(): void {
    this.collectFormData();
    
    if (!this.formData.content.trim()) return;

    const autosaveKey = `autosave_add_content`;
    localStorage.setItem(autosaveKey, JSON.stringify({
      ...this.formData,
      savedAt: new Date().toISOString()
    }));
  }

  private loadAutosave(): void {
    const autosaveKey = `autosave_add_content`;
    const saved = localStorage.getItem(autosaveKey);
    
    if (saved) {
      const data = JSON.parse(saved);
      const savedDate = new Date(data.savedAt);
      const now = new Date();
      const hoursSince = (now.getTime() - savedDate.getTime()) / (1000 * 60 * 60);
      
      // Only load if less than 24 hours old
      if (hoursSince < 24) {
        this.showMessage('Autosaved content restored', 'info');
        
        // Populate form with saved data
        const form = this.querySelector('#add-content-form') as HTMLFormElement;
        if (form) {
          (form.elements.namedItem('grade') as RadioNodeList).value = data.grade.toString();
          (form.elements.namedItem('unit') as HTMLInputElement).value = data.unit.toString();
          (form.elements.namedItem('unitTitle') as HTMLInputElement).value = data.unitTitle;
          (form.elements.namedItem('lesson') as RadioNodeList).value = data.lesson;
          (form.elements.namedItem('content') as HTMLTextAreaElement).value = data.content;
          (form.elements.namedItem('source') as RadioNodeList).value = data.source;
          
          this.formData = data;
          const charCount = this.querySelector('#char-count');
          if (charCount) {
            charCount.textContent = data.content.length.toString();
          }
        }
      }
    }
  }

  private saveToRecentActivity(): void {
    const activity = {
      icon: '✅',
      text: `Added content: Grade ${this.formData.grade}, Unit ${this.formData.unit}, ${this.formData.lesson}`,
      time: new Date().toISOString()
    };

    const activities = JSON.parse(localStorage.getItem('recent_activity') || '[]');
    activities.unshift(activity);
    localStorage.setItem('recent_activity', JSON.stringify(activities.slice(0, 10)));
  }

  private updateProcessingState(isProcessing: boolean): void {
    const processBtn = this.querySelector('#process-btn');
    const btnText = this.querySelector('.btn-text');
    const spinner = this.querySelector('.processing-spinner');
    const form = this.querySelector('#add-content-form') as HTMLFormElement;

    if (processBtn) {
      processBtn.classList.toggle('disabled', isProcessing);
      (processBtn as HTMLButtonElement).disabled = isProcessing;
    }

    if (btnText && spinner) {
      btnText.classList.toggle('hidden', isProcessing);
      spinner.classList.toggle('hidden', !isProcessing);
    }

    if (form) {
      const inputs = form.querySelectorAll('input, textarea, button');
      inputs.forEach(input => {
        if (input !== processBtn) {
          (input as HTMLInputElement | HTMLTextAreaElement | HTMLButtonElement).disabled = isProcessing;
        }
      });
    }
  }

  private showMessage(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    const messageEl = this.querySelector('#status-message');
    if (messageEl) {
      messageEl.textContent = message;
      messageEl.className = `status-message status-message--${type}`;
      messageEl.classList.remove('hidden');

      if (type !== 'info') {
        setTimeout(() => {
          messageEl.classList.add('hidden');
        }, 5000);
      }
    }
  }

  protected onMount(): void {
    // Load any autosaved content
    this.loadAutosave();
  }

  protected onDestroy(): void {
    // Clear autosave when leaving the page normally
    if (!this.isProcessing) {
      localStorage.removeItem('autosave_add_content');
    }
  }
}