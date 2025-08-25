import { Component } from '@components/core/Component';
import { audioService } from '@services/AudioService';
import type { VocabularyCardProps, VocabularyItem } from '@/types';

/**
 * VocabularyCard Component
 * Interactive vocabulary display with pronunciation and selection
 */
export class VocabularyCard extends Component<VocabularyCardProps> {
  private isPlaying = false;
  private isSelected = false;

  constructor(props: VocabularyCardProps) {
    super(props);
    this.isSelected = props.selected || false;
  }

  protected createElement(): HTMLElement {
    const card = document.createElement('div');
    card.className = 'vocabulary-card';
    
    const word = this.props.word;
    card.innerHTML = `
      <div class="vocabulary-card__header">
        <div class="vocabulary-card__word-info">
          <h3 class="vocabulary-card__word">${word.word}</h3>
          <span class="vocabulary-card__pronunciation">${word.pronunciation.ipa}</span>
          <span class="vocabulary-card__pos">${word.part_of_speech}</span>
          <span class="vocabulary-card__cefr">${word.cefr}</span>
        </div>
        <div class="vocabulary-card__controls">
          <button class="pronunciation-btn" type="button" aria-label="Play pronunciation">
            <span class="pronunciation-btn__icon">🔊</span>
          </button>
          <button class="select-btn" type="button" aria-label="Select for quiz">
            <span class="select-btn__icon">✓</span>
          </button>
        </div>
      </div>
      
      <div class="vocabulary-card__content">
        <div class="vocabulary-card__definition">
          <strong>Definition:</strong> ${word.definition}
        </div>
        
        <div class="vocabulary-card__translation ${this.props.showTranslation ? 'visible' : 'hidden'}">
          <strong>Vietnamese:</strong> ${word.translation}
        </div>
        
        <div class="vocabulary-card__examples">
          <strong>Examples:</strong>
          <ul class="examples-list">
            ${word.examples.map(example => `
              <li class="example-item">
                <div class="example-text">${example.text}</div>
                <div class="example-translation">${example.translation}</div>
              </li>
            `).join('')}
          </ul>
        </div>
        
        ${word.collocations.length > 0 ? `
          <div class="vocabulary-card__collocations">
            <strong>Common phrases:</strong>
            <div class="collocations-list">
              ${word.collocations.map(coll => `
                <span class="collocation-item">${coll.phrase}</span>
              `).join('')}
            </div>
          </div>
        ` : ''}
        
        ${word.synonyms.length > 0 ? `
          <div class="vocabulary-card__synonyms">
            <strong>Synonyms:</strong>
            <div class="synonyms-list">
              ${word.synonyms.map(syn => `
                <span class="synonym-item">${syn.word} <small>(${syn.cefr})</small></span>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
      
      <div class="vocabulary-card__footer">
        <div class="frequency-indicator">
          <span class="frequency-label">Frequency:</span>
          <span class="frequency-value frequency--${word.frequency}">${word.frequency}</span>
        </div>
        <div class="audio-indicators">
          ${word.pronunciation.audio_files.map(audio => `
            <span class="accent-indicator accent--${audio.accent}" title="${audio.accent} accent available">
              ${audio.accent.substring(0, 2).toUpperCase()}
            </span>
          `).join('')}
        </div>
      </div>
    `;

    this.updateSelectedState();
    return card;
  }

  protected bindEvents(): void {
    const pronunciationBtn = this.querySelector('.pronunciation-btn');
    const selectBtn = this.querySelector('.select-btn');
    const card = this.element;

    // Pronunciation button click
    pronunciationBtn?.addEventListener('click', async (e) => {
      e.stopPropagation();
      await this.playPronunciation();
    });

    // Selection button click
    selectBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleSelection();
    });

    // Card click for pronunciation (double-click prevention)
    let clickTimer: NodeJS.Timeout | null = null;
    card.addEventListener('click', () => {
      if (clickTimer) {
        clearTimeout(clickTimer);
        clickTimer = null;
        return; // This is a double-click, ignore
      }
      
      clickTimer = setTimeout(async () => {
        await this.playPronunciation();
        clickTimer = null;
      }, 300);
    });

    // Double-click for selection
    card.addEventListener('dblclick', () => {
      this.toggleSelection();
    });

    // Keyboard navigation
    card.addEventListener('keydown', async (e) => {
      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault();
          await this.playPronunciation();
          break;
        case 's':
        case 'S':
          e.preventDefault();
          this.toggleSelection();
          break;
        case 't':
        case 'T':
          e.preventDefault();
          this.toggleTranslation();
          break;
      }
    });

    // Hover effects for accessibility
    card.addEventListener('mouseenter', () => {
      if (!this.isPlaying) {
        card.classList.add('hovered');
      }
    });

    card.addEventListener('mouseleave', () => {
      card.classList.remove('hovered');
    });
  }

  /**
   * Play pronunciation audio
   */
  private async playPronunciation(): Promise<void> {
    if (this.isPlaying) return;

    const pronunciationBtn = this.querySelector('.pronunciation-btn');
    const word = this.props.word;

    try {
      this.isPlaying = true;
      pronunciationBtn?.classList.add('playing');
      this.element.classList.add('playing-audio');

      await audioService.playPronunciation(
        word.word,
        word.pronunciation.audio_files,
        true
      );

      // Call parent callback
      this.props.onPronounce?.(word.pronunciation.audio_files[0]?.file || '');

      // Emit event
      this.eventBus.emit('pronunciation-play', word.word);

      // Visual feedback animation
      this.animate('pulse-pronunciation', 600);

    } catch (error) {
      console.error('Failed to play pronunciation:', error);
      this.element.classList.add('audio-error');
      setTimeout(() => {
        this.element.classList.remove('audio-error');
      }, 1000);
    } finally {
      this.isPlaying = false;
      pronunciationBtn?.classList.remove('playing');
      this.element.classList.remove('playing-audio');
    }
  }

  /**
   * Toggle selection state
   */
  private toggleSelection(): void {
    this.isSelected = !this.isSelected;
    this.updateSelectedState();
    
    // Call parent callback
    this.props.onSelect?.(this.props.word);
    
    // Visual feedback
    this.animate(this.isSelected ? 'select-in' : 'select-out', 300);
  }

  /**
   * Update visual selection state
   */
  private updateSelectedState(): void {
    const selectBtn = this.querySelector('.select-btn');
    
    this.element.classList.toggle('selected', this.isSelected);
    this.element.setAttribute('aria-selected', this.isSelected.toString());
    
    if (selectBtn) {
      selectBtn.classList.toggle('active', this.isSelected);
      const icon = selectBtn.querySelector('.select-btn__icon');
      if (icon) {
        icon.textContent = this.isSelected ? '✓' : '+';
      }
    }
  }

  /**
   * Toggle translation visibility
   */
  private toggleTranslation(): void {
    const translationEl = this.querySelector('.vocabulary-card__translation');
    if (translationEl) {
      const isVisible = translationEl.classList.contains('visible');
      translationEl.classList.toggle('visible', !isVisible);
      translationEl.classList.toggle('hidden', isVisible);
      
      this.updateProps({ showTranslation: !isVisible });
    }
  }

  /**
   * Set focus on the card
   */
  public focus(): void {
    this.element.focus();
    this.element.classList.add('focused');
  }

  /**
   * Remove focus from the card
   */
  public blur(): void {
    this.element.blur();
    this.element.classList.remove('focused');
  }

  /**
   * Get selection state
   */
  public isCardSelected(): boolean {
    return this.isSelected;
  }

  /**
   * Set selection state programmatically
   */
  public setSelected(selected: boolean): void {
    if (this.isSelected !== selected) {
      this.isSelected = selected;
      this.updateSelectedState();
    }
  }

  /**
   * Get vocabulary word
   */
  public getVocabulary(): VocabularyItem {
    return this.props.word;
  }

  /**
   * Update card content when props change
   */
  protected onPropsUpdate(): void {
    const hasWordChanged = this.props.word.id !== this.props.word.id;
    const hasSelectionChanged = this.props.selected !== this.isSelected;
    
    if (hasSelectionChanged) {
      this.isSelected = this.props.selected || false;
      this.updateSelectedState();
    }
    
    if (hasWordChanged) {
      // Re-create the element with new word data
      const newElement = this.createElement();
      this.element.replaceWith(newElement);
      this.element = newElement;
      this.bindEvents();
    }
  }

  /**
   * Start pronunciation automatically
   */
  public async autoPlay(): Promise<void> {
    await this.playPronunciation();
  }

  /**
   * Highlight specific example or collocation
   */
  public highlightUsage(text: string): void {
    const examples = this.querySelectorAll('.example-text, .collocation-item');
    examples.forEach(el => {
      const element = el as HTMLElement;
      if (element.textContent?.toLowerCase().includes(text.toLowerCase())) {
        element.classList.add('highlighted');
        setTimeout(() => {
          element.classList.remove('highlighted');
        }, 2000);
      }
    });
  }

  /**
   * Get card metrics for analytics
   */
  public getAnalytics(): VocabularyCardAnalytics {
    return {
      wordId: this.props.word.id,
      word: this.props.word.word,
      pronunciationPlays: 0, // Would track this in a real implementation
      timeSpent: 0, // Would track this in a real implementation
      selected: this.isSelected,
      translationViewed: this.props.showTranslation
    };
  }

  /**
   * Cleanup on destroy
   */
  protected onDestroy(): void {
    // Stop any ongoing audio
    if (this.isPlaying) {
      audioService.stopPlayback();
    }
  }
}

// Supporting interfaces
interface VocabularyCardAnalytics {
  wordId: string;
  word: string;
  pronunciationPlays: number;
  timeSpent: number;
  selected: boolean;
  translationViewed: boolean;
}