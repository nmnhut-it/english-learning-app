import { marked } from 'marked';
import { Component } from '@components/core/Component';
import { audioService } from '@services/AudioService';
import type { MarkdownViewerProps, VocabularyItem, Unit, VocabularyReference } from '@/types';

/**
 * MarkdownViewer Component
 * Displays markdown content with vocabulary highlighting and click-to-pronounce
 */
export class MarkdownViewer extends Component<MarkdownViewerProps> {
  private currentContent = '';
  private vocabularyMap: Map<string, VocabularyItem> = new Map();
  private highlightedWords: Set<string> = new Set();

  constructor(props: MarkdownViewerProps) {
    super(props);
    this.setupMarkedOptions();
    this.processVocabulary();
  }

  protected createElement(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'markdown-viewer';
    container.innerHTML = `
      <div class="markdown-viewer__content"></div>
      <div class="markdown-viewer__controls">
        <button class="vocab-toggle" type="button" aria-label="Toggle vocabulary highlighting">
          <span class="vocab-toggle__icon">🔍</span>
          <span class="vocab-toggle__text">Highlight Vocabulary</span>
        </button>
        <div class="vocabulary-count">
          <span class="count-label">Vocabulary:</span>
          <span class="count-number">0</span>
        </div>
      </div>
    `;

    this.renderContent();
    return container;
  }

  protected bindEvents(): void {
    const toggleBtn = this.querySelector('.vocab-toggle');
    const contentArea = this.querySelector('.markdown-viewer__content');

    // Toggle vocabulary highlighting
    toggleBtn?.addEventListener('click', () => {
      this.toggleVocabularyHighlighting();
    });

    // Handle vocabulary clicks
    contentArea?.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('vocabulary-word')) {
        e.preventDefault();
        this.handleVocabularyClick(target);
      }
    });

    // Keyboard navigation
    this.addEventListener('keydown', (e) => {
      if (e.key === 'v' && e.ctrlKey) {
        e.preventDefault();
        this.toggleVocabularyHighlighting();
      }
    });

    // Mouse hover effects
    contentArea?.addEventListener('mouseover', (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('vocabulary-word')) {
        this.showVocabularyPreview(target);
      }
    });

    contentArea?.addEventListener('mouseout', (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('vocabulary-word')) {
        this.hideVocabularyPreview();
      }
    });
  }

  /**
   * Setup marked.js configuration
   */
  private setupMarkedOptions(): void {
    marked.setOptions({
      gfm: true,
      breaks: true,
      headerIds: true,
      mangle: false,
      sanitize: false, // We'll handle vocabulary highlighting
    });

    // Custom renderer for vocabulary highlighting
    const renderer = new marked.Renderer();
    
    // Override text rendering to highlight vocabulary
    const originalText = renderer.text.bind(renderer);
    renderer.text = (text: string) => {
      if (this.props.highlightVocabulary) {
        return this.highlightVocabularyInText(text);
      }
      return originalText(text);
    };

    marked.setOptions({ renderer });
  }

  /**
   * Process vocabulary from current unit
   */
  private processVocabulary(): void {
    if (!this.props.currentUnit) return;

    this.vocabularyMap.clear();
    this.props.currentUnit.vocabulary_bank.forEach(item => {
      this.vocabularyMap.set(item.word.toLowerCase(), item);
      // Also map any alternative forms
      item.word_family.forEach(related => {
        this.vocabularyMap.set(related.word.toLowerCase(), item);
      });
    });

    this.updateVocabularyCount();
  }

  /**
   * Render markdown content
   */
  private renderContent(): void {
    const contentArea = this.querySelector('.markdown-viewer__content');
    if (!contentArea) return;

    try {
      const htmlContent = marked.parse(this.props.content);
      contentArea.innerHTML = htmlContent;
      this.currentContent = this.props.content;
      
      // Add ARIA labels and semantic markup
      this.enhanceAccessibility(contentArea);
      
      // Scroll to top
      contentArea.scrollTop = 0;
      
    } catch (error) {
      console.error('Failed to render markdown:', error);
      contentArea.innerHTML = `
        <div class="error-message">
          <h3>Failed to render content</h3>
          <p>There was an error rendering the markdown content. Please try again.</p>
        </div>
      `;
    }
  }

  /**
   * Highlight vocabulary words in text
   */
  private highlightVocabularyInText(text: string): string {
    if (!this.vocabularyMap.size) return text;

    let highlightedText = text;
    const words = Array.from(this.vocabularyMap.keys()).sort((a, b) => b.length - a.length);

    words.forEach(word => {
      const regex = new RegExp(`\\b${this.escapeRegex(word)}\\b`, 'gi');
      highlightedText = highlightedText.replace(regex, (match) => {
        const vocabItem = this.vocabularyMap.get(match.toLowerCase());
        if (vocabItem) {
          return this.createVocabularySpan(match, vocabItem);
        }
        return match;
      });
    });

    return highlightedText;
  }

  /**
   * Create vocabulary span element
   */
  private createVocabularySpan(word: string, vocab: VocabularyItem): string {
    return `<span class="vocabulary-word" 
                  data-vocab-id="${vocab.id}"
                  data-word="${vocab.word}"
                  data-definition="${this.escapeHtml(vocab.definition)}"
                  data-translation="${this.escapeHtml(vocab.translation)}"
                  data-pronunciation="${vocab.pronunciation.ipa}"
                  title="${vocab.definition} (${vocab.translation})"
                  tabindex="0"
                  role="button"
                  aria-label="Click to hear pronunciation of ${word}">
              ${word}
            </span>`;
  }

  /**
   * Toggle vocabulary highlighting
   */
  private toggleVocabularyHighlighting(): void {
    const newHighlightState = !this.props.highlightVocabulary;
    
    this.updateProps({ highlightVocabulary: newHighlightState });
    this.renderContent();
    
    const toggleBtn = this.querySelector('.vocab-toggle');
    if (toggleBtn) {
      toggleBtn.classList.toggle('active', newHighlightState);
      const text = toggleBtn.querySelector('.vocab-toggle__text');
      if (text) {
        text.textContent = newHighlightState ? 'Hide Vocabulary' : 'Highlight Vocabulary';
      }
    }
  }

  /**
   * Handle vocabulary word click
   */
  private async handleVocabularyClick(element: HTMLElement): Promise<void> {
    const vocabId = element.dataset.vocabId;
    if (!vocabId) return;

    const vocab = Array.from(this.vocabularyMap.values())
      .find(item => item.id === vocabId);
    
    if (!vocab) return;

    // Visual feedback
    element.classList.add('clicking');
    setTimeout(() => {
      element.classList.remove('clicking');
    }, 200);

    try {
      // Play pronunciation
      await audioService.playPronunciation(
        vocab.word, 
        vocab.pronunciation.audio_files,
        true // fallback to TTS
      );

      // Emit event for parent components
      this.props.onVocabularyClick?.(vocab);
      
      // Update recent vocabulary list
      this.eventBus.emit('vocabulary-click', vocab);
      
    } catch (error) {
      console.error('Failed to play pronunciation:', error);
      // Visual error feedback
      element.classList.add('error');
      setTimeout(() => {
        element.classList.remove('error');
      }, 1000);
    }
  }

  /**
   * Show vocabulary preview on hover
   */
  private showVocabularyPreview(element: HTMLElement): void {
    const definition = element.dataset.definition;
    const translation = element.dataset.translation;
    const pronunciation = element.dataset.pronunciation;
    
    if (!definition) return;

    // Remove existing preview
    this.hideVocabularyPreview();

    // Create preview tooltip
    const preview = document.createElement('div');
    preview.className = 'vocabulary-preview';
    preview.innerHTML = `
      <div class="vocabulary-preview__content">
        <div class="vocabulary-preview__pronunciation">${pronunciation}</div>
        <div class="vocabulary-preview__definition">${definition}</div>
        <div class="vocabulary-preview__translation">${translation}</div>
        <div class="vocabulary-preview__hint">Click to hear pronunciation</div>
      </div>
    `;

    // Position preview
    const rect = element.getBoundingClientRect();
    preview.style.position = 'fixed';
    preview.style.left = `${rect.left}px`;
    preview.style.top = `${rect.bottom + 5}px`;
    preview.style.zIndex = '1000';

    document.body.appendChild(preview);
    
    // Animate in
    requestAnimationFrame(() => {
      preview.classList.add('visible');
    });
  }

  /**
   * Hide vocabulary preview
   */
  private hideVocabularyPreview(): void {
    const existing = document.querySelector('.vocabulary-preview');
    if (existing) {
      existing.remove();
    }
  }

  /**
   * Update vocabulary count display
   */
  private updateVocabularyCount(): void {
    const countElement = this.querySelector('.count-number');
    if (countElement) {
      countElement.textContent = this.vocabularyMap.size.toString();
    }
  }

  /**
   * Enhance accessibility of rendered content
   */
  private enhanceAccessibility(contentArea: Element): void {
    // Add proper heading hierarchy
    const headings = contentArea.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach((heading, index) => {
      heading.id = heading.id || `heading-${index}`;
    });

    // Add alt text to images if missing
    const images = contentArea.querySelectorAll('img');
    images.forEach(img => {
      if (!img.getAttribute('alt')) {
        img.setAttribute('alt', 'Content image');
      }
    });

    // Make links keyboard accessible
    const links = contentArea.querySelectorAll('a');
    links.forEach(link => {
      if (!link.getAttribute('tabindex')) {
        link.setAttribute('tabindex', '0');
      }
    });
  }

  /**
   * Update component when props change
   */
  protected onPropsUpdate(): void {
    const hasContentChanged = this.currentContent !== this.props.content;
    const hasUnitChanged = this.props.currentUnit;
    
    if (hasUnitChanged) {
      this.processVocabulary();
    }
    
    if (hasContentChanged || hasUnitChanged) {
      this.renderContent();
    }
  }

  /**
   * Get all highlighted vocabulary words
   */
  public getHighlightedVocabulary(): VocabularyItem[] {
    return Array.from(this.vocabularyMap.values());
  }

  /**
   * Search for text in content
   */
  public search(query: string): boolean {
    const contentArea = this.querySelector('.markdown-viewer__content');
    if (!contentArea) return false;

    const content = contentArea.textContent?.toLowerCase() || '';
    const found = content.includes(query.toLowerCase());
    
    if (found) {
      // Simple highlight - in production would use proper search highlighting
      const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
      contentArea.innerHTML = contentArea.innerHTML.replace(regex, '<mark>$1</mark>');
    }

    return found;
  }

  /**
   * Clear search highlighting
   */
  public clearSearch(): void {
    this.renderContent();
  }

  // Utility methods
  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Cleanup on destroy
   */
  protected onDestroy(): void {
    this.hideVocabularyPreview();
    this.vocabularyMap.clear();
    this.highlightedWords.clear();
  }
}