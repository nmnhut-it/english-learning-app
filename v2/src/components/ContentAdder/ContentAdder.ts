import { Component } from '@components/core/Component';
import { contentService } from '@services/ContentService';
import { contentProcessor } from '@services/ContentProcessor';
import type { ContentAdderProps, ContentAdderForm, LessonType } from '@/types';

/**
 * ContentAdder Component
 * Modal/Form for adding new content to units and lessons
 */
export class ContentAdder extends Component<ContentAdderProps> {
  private formData: ContentAdderForm = {
    grade: 7,
    unit: 1,
    unitTitle: '',
    lesson: 'getting_started' as LessonType,
    content: '',
    source: 'manual',
    autoProcess: true
  };

  private isProcessing = false;

  // Lesson options for different grade levels
  private readonly lessonsGrade6to9 = [
    { value: 'getting_started', label: 'Getting Started' },
    { value: 'closer_look_1', label: 'A Closer Look 1 (Vocabulary)' },
    { value: 'closer_look_2', label: 'A Closer Look 2 (Grammar)' },
    { value: 'communication', label: 'Communication' },
    { value: 'skills_1', label: 'Skills 1 (Reading & Speaking)' },
    { value: 'skills_2', label: 'Skills 2 (Listening & Writing)' },
    { value: 'looking_back', label: 'Looking Back' }
  ];

  private readonly lessonsGrade10to12 = [
    { value: 'getting_started', label: 'Getting Started' },
    { value: 'language', label: 'Language' },
    { value: 'reading', label: 'Reading' },
    { value: 'listening', label: 'Listening' },
    { value: 'speaking', label: 'Speaking' },
    { value: 'writing', label: 'Writing' },
    { value: 'communication_culture', label: 'Communication & Culture' },
    { value: 'looking_back', label: 'Looking Back' }
  ];

  protected createElement(): HTMLElement {
    const modal = document.createElement('div');
    modal.className = 'content-adder-modal';
    
    modal.innerHTML = `
      <div class="content-adder-overlay"></div>
      <div class="content-adder">
        <div class="content-adder__header">
          <h2 class="content-adder__title">Add New Content</h2>
          <button class="content-adder__close" type="button" aria-label="Close">×</button>
        </div>
        
        <div class="content-adder__body">
          <div class="form-section">
            <h3 class="form-section__title">Grade Selection</h3>
            <div class="grade-selector">
              ${[6, 7, 8, 9, 10, 11, 12].map(grade => `
                <label class="grade-option">
                  <input type="radio" name="grade" value="${grade}" ${grade === 7 ? 'checked' : ''}>
                  <span class="grade-label">Grade ${grade}</span>
                </label>
              `).join('')}
            </div>
          </div>
          
          <div class="form-section">
            <h3 class="form-section__title">Unit Information</h3>
            <div class="form-row">
              <div class="form-field">
                <label for="unit-number">Unit Number</label>
                <input type="number" id="unit-number" min="1" max="12" value="1" class="unit-number-input">
              </div>
              <div class="form-field">
                <label for="unit-title">Unit Title</label>
                <input type="text" id="unit-title" placeholder="e.g., Hobbies, Healthy Living" class="unit-title-input">
              </div>
            </div>
          </div>
          
          <div class="form-section">
            <h3 class="form-section__title">Lesson/Activity</h3>
            <div class="lesson-selector">
              ${this.getLessonOptions(7)}
            </div>
          </div>
          
          <div class="form-section">
            <h3 class="form-section__title">Content Source</h3>
            <div class="source-selector">
              <label class="source-option">
                <input type="radio" name="source" value="loigiahay" checked>
                <span>Loigiahay</span>
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
          
          <div class="form-section">
            <h3 class="form-section__title">Content</h3>
            <textarea 
              class="content-textarea" 
              placeholder="Paste your content here..."
              rows="10"
            ></textarea>
          </div>
          
          <div class="form-section">
            <label class="checkbox-option">
              <input type="checkbox" class="auto-process-checkbox" checked>
              <span>Auto-extract vocabulary with AI</span>
            </label>
            <label class="checkbox-option">
              <input type="checkbox" class="generate-exercises-checkbox" checked>
              <span>Generate exercises from content</span>
            </label>
          </div>
        </div>
        
        <div class="content-adder__footer">
          <button class="btn btn--secondary cancel-btn" type="button">Cancel</button>
          <button class="btn btn--primary save-draft-btn" type="button">Save Draft</button>
          <button class="btn btn--success process-save-btn" type="button">
            <span class="btn-text">Process & Save</span>
            <span class="processing-spinner hidden">⏳ Processing...</span>
          </button>
        </div>
      </div>
    `;

    return modal;
  }

  protected bindEvents(): void {
    // Close button
    const closeBtn = this.querySelector('.content-adder__close');
    const cancelBtn = this.querySelector('.cancel-btn');
    const overlay = this.querySelector('.content-adder-overlay');

    closeBtn?.addEventListener('click', () => this.close());
    cancelBtn?.addEventListener('click', () => this.close());
    overlay?.addEventListener('click', () => this.close());

    // Grade selection
    const gradeInputs = this.querySelectorAll('input[name="grade"]');
    gradeInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        this.formData.grade = parseInt(target.value);
        this.updateLessonOptions();
      });
    });

    // Unit information
    const unitNumberInput = this.querySelector('.unit-number-input') as HTMLInputElement;
    const unitTitleInput = this.querySelector('.unit-title-input') as HTMLInputElement;

    unitNumberInput?.addEventListener('change', (e) => {
      this.formData.unit = parseInt((e.target as HTMLInputElement).value);
    });

    unitTitleInput?.addEventListener('input', (e) => {
      this.formData.unitTitle = (e.target as HTMLInputElement).value;
    });

    // Lesson selection
    this.bindLessonSelectionEvents();

    // Source selection
    const sourceInputs = this.querySelectorAll('input[name="source"]');
    sourceInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        this.formData.source = target.value as 'loigiahay' | 'manual' | 'textbook';
      });
    });

    // Content textarea
    const contentTextarea = this.querySelector('.content-textarea') as HTMLTextAreaElement;
    contentTextarea?.addEventListener('input', (e) => {
      this.formData.content = (e.target as HTMLTextAreaElement).value;
    });

    // Checkboxes
    const autoProcessCheckbox = this.querySelector('.auto-process-checkbox') as HTMLInputElement;
    autoProcessCheckbox?.addEventListener('change', (e) => {
      this.formData.autoProcess = (e.target as HTMLInputElement).checked;
    });

    // Save buttons
    const saveDraftBtn = this.querySelector('.save-draft-btn');
    const processSaveBtn = this.querySelector('.process-save-btn');

    saveDraftBtn?.addEventListener('click', () => this.saveDraft());
    processSaveBtn?.addEventListener('click', () => this.processAndSave());

    // Keyboard shortcuts
    this.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.close();
      }
    });
  }

  private getLessonOptions(grade: number): string {
    const lessons = grade >= 10 ? this.lessonsGrade10to12 : this.lessonsGrade6to9;
    
    return lessons.map(lesson => `
      <label class="lesson-option">
        <input type="radio" name="lesson" value="${lesson.value}" ${lesson.value === 'getting_started' ? 'checked' : ''}>
        <span>${lesson.label}</span>
      </label>
    `).join('');
  }

  private updateLessonOptions(): void {
    const lessonSelector = this.querySelector('.lesson-selector');
    if (lessonSelector) {
      lessonSelector.innerHTML = this.getLessonOptions(this.formData.grade);
      this.bindLessonSelectionEvents();
    }
  }

  private bindLessonSelectionEvents(): void {
    const lessonInputs = this.querySelectorAll('input[name="lesson"]');
    lessonInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        this.formData.lesson = target.value as LessonType;
      });
    });
  }

  private async saveDraft(): Promise<void> {
    if (!this.validateForm()) return;

    try {
      // Save to localStorage as draft
      const draftKey = `draft_${this.formData.grade}_${this.formData.unit}_${this.formData.lesson}`;
      localStorage.setItem(draftKey, JSON.stringify(this.formData));
      
      this.showNotification('Draft saved successfully');
      this.close();
    } catch (error) {
      console.error('Failed to save draft:', error);
      this.showNotification('Failed to save draft', 'error');
    }
  }

  private async processAndSave(): Promise<void> {
    if (!this.validateForm()) return;
    if (this.isProcessing) return;

    try {
      this.isProcessing = true;
      this.updateProcessingState(true);

      if (this.formData.autoProcess) {
        // Process with AI
        const result = await contentProcessor.processLessonContent(
          this.formData.content,
          this.formData.grade,
          this.formData.unit,
          this.formData.lesson,
          this.formData.unitTitle,
          true // Save raw content
        );

        if (!result.success) {
          throw new Error(result.message || 'Processing failed');
        }
      } else {
        // Save raw content
        await contentService.saveRawContent(
          this.formData.grade,
          this.formData.unit,
          this.formData.lesson,
          this.formData
        );
      }

      this.showNotification('Content saved successfully');
      this.props.onContentSave(this.formData);
      this.close();
      
    } catch (error) {
      console.error('Failed to process and save:', error);
      this.showNotification('Failed to process content', 'error');
    } finally {
      this.isProcessing = false;
      this.updateProcessingState(false);
    }
  }

  private validateForm(): boolean {
    const errors: string[] = [];

    if (!this.formData.unitTitle) {
      errors.push('Unit title is required');
    }

    if (!this.formData.content) {
      errors.push('Content is required');
    }

    if (this.formData.unit < 1 || this.formData.unit > 12) {
      errors.push('Unit number must be between 1 and 12');
    }

    if (errors.length > 0) {
      this.showNotification(errors.join(', '), 'error');
      return false;
    }

    return true;
  }

  private updateProcessingState(isProcessing: boolean): void {
    const processSaveBtn = this.querySelector('.process-save-btn');
    const btnText = this.querySelector('.btn-text');
    const spinner = this.querySelector('.processing-spinner');

    if (processSaveBtn) {
      processSaveBtn.classList.toggle('disabled', isProcessing);
    }

    if (btnText && spinner) {
      btnText.classList.toggle('hidden', isProcessing);
      spinner.classList.toggle('hidden', !isProcessing);
    }
  }

  private showNotification(message: string, type: 'success' | 'error' = 'success'): void {
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.textContent = message;
    
    this.element.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  private close(): void {
    this.element.classList.add('closing');
    setTimeout(() => {
      this.props.onCancel();
      this.destroy();
    }, 300);
  }

  public open(): void {
    this.element.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  protected onDestroy(): void {
    document.body.style.overflow = '';
  }
}

// Export singleton for easy access
export const createContentAdder = (props: ContentAdderProps): ContentAdder => {
  return new ContentAdder(props);
};