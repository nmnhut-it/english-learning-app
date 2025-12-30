/**
 * Flashcard Learning Scene
 * Introduces vocabulary through interactive flashcards
 */

import Phaser from 'phaser';
import { BaseScene, BaseSceneData } from './BaseScene';
import type { VocabularyItem } from '../types/GameTypes';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  COLORS,
  COLOR_STRINGS,
  TEXT_STYLES,
} from '../config/GameConfig';

type CardSide = 'front' | 'back';

export class FlashcardScene extends BaseScene {
  private card!: Phaser.GameObjects.Container;
  private cardFront!: Phaser.GameObjects.Container;
  private cardBack!: Phaser.GameObjects.Container;
  private currentWord!: VocabularyItem;
  private currentSide: CardSide = 'front';
  private isFlipping: boolean = false;

  private knowButton!: Phaser.GameObjects.Container;
  private learnButton!: Phaser.GameObjects.Container;
  private flipButton!: Phaser.GameObjects.Container;

  constructor() {
    super('FlashcardScene');
  }

  protected getWordsForSession(): VocabularyItem[] {
    // For learn mode, just use the vocabulary set items directly
    return [...this.vocabularySet.items];
  }

  create(): void {
    super.create();

    // Title
    this.add.text(GAME_WIDTH / 2, 90, 'Learn Vocabulary', TEXT_STYLES.subtitle as Phaser.Types.GameObjects.Text.TextStyle)
      .setOrigin(0.5);

    // Instructions
    this.add.text(GAME_WIDTH / 2, 130, 'Tap card or button to flip', {
      ...TEXT_STYLES.body,
      color: COLOR_STRINGS.TEXT_MUTED,
    } as Phaser.Types.GameObjects.Text.TextStyle).setOrigin(0.5);

    // Create action buttons
    this.createActionButtons();

    // Show first card
    this.showNextCard();
  }

  private createActionButtons(): void {
    const buttonY = GAME_HEIGHT - 100;
    const buttonWidth = 150;
    const buttonHeight = 50;
    const spacing = 170;

    // Know button (green)
    this.knowButton = this.createButton(
      GAME_WIDTH / 2 - spacing,
      buttonY,
      '✓ Know it',
      () => this.handleKnow(),
      buttonWidth,
      buttonHeight,
      COLORS.CORRECT
    );

    // Flip button
    this.flipButton = this.createButton(
      GAME_WIDTH / 2,
      buttonY,
      '↻ Flip',
      () => this.flipCard(),
      buttonWidth,
      buttonHeight,
      COLORS.SECONDARY
    );

    // Learn button (orange)
    this.learnButton = this.createButton(
      GAME_WIDTH / 2 + spacing,
      buttonY,
      '📚 Learn',
      () => this.handleLearn(),
      buttonWidth,
      buttonHeight,
      COLORS.WARNING
    );
  }

  private showNextCard(): void {
    if (this.currentIndex >= this.currentWords.length) {
      this.completeGame();
      return;
    }

    this.currentWord = this.currentWords[this.currentIndex];
    this.currentSide = 'front';

    // Clear previous card
    if (this.card) {
      this.card.destroy();
    }

    // Create new card
    this.createCard();

    // Animate in
    this.animateCardIn();

    // Auto-play pronunciation
    this.time.delayedCall(300, () => {
      this.audio.playPronunciation(
        this.currentWord.word,
        this.currentWord.pronunciation.audioUrl
      );
    });
  }

  private createCard(): void {
    this.card = this.add.container(GAME_WIDTH / 2, 330);

    const cardWidth = 450;
    const cardHeight = 280;

    // Front side (English word)
    this.cardFront = this.createCardFront(cardWidth, cardHeight);
    this.card.add(this.cardFront);

    // Back side (Vietnamese meaning + examples)
    this.cardBack = this.createCardBack(cardWidth, cardHeight);
    this.cardBack.setVisible(false);
    this.card.add(this.cardBack);

    // Make card interactive
    this.card.setSize(cardWidth, cardHeight);
    this.card.setInteractive({ useHandCursor: true });
    this.card.on('pointerdown', () => this.flipCard());
  }

  private createCardFront(width: number, height: number): Phaser.GameObjects.Container {
    const container = this.add.container(0, 0);

    // Background
    const bg = this.add.rectangle(0, 0, width, height, COLORS.BG_CARD)
      .setStrokeStyle(4, COLORS.PRIMARY);
    container.add(bg);

    // Word
    const wordText = this.add.text(0, -40, this.currentWord.word, {
      ...TEXT_STYLES.title,
      fontSize: '36px',
    } as Phaser.Types.GameObjects.Text.TextStyle).setOrigin(0.5);
    container.add(wordText);

    // Part of speech
    const posText = this.add.text(0, 10, `(${this.currentWord.partOfSpeech})`, {
      ...TEXT_STYLES.body,
      color: COLOR_STRINGS.TEXT_MUTED,
    } as Phaser.Types.GameObjects.Text.TextStyle).setOrigin(0.5);
    container.add(posText);

    // Pronunciation
    const ipaText = this.add.text(0, 50, this.currentWord.pronunciation.ipa, {
      ...TEXT_STYLES.pronunciation,
      fontSize: '24px',
    } as Phaser.Types.GameObjects.Text.TextStyle).setOrigin(0.5);
    container.add(ipaText);

    // Audio button
    const audioBtn = this.add.container(width / 2 - 50, -height / 2 + 40);
    const audioBg = this.add.circle(0, 0, 25, COLORS.PRIMARY);
    const audioIcon = this.add.text(0, 0, '🔊', { fontSize: '20px' }).setOrigin(0.5);
    audioBtn.add([audioBg, audioIcon]);
    audioBtn.setSize(50, 50);
    audioBtn.setInteractive({ useHandCursor: true });
    audioBtn.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
      this.audio.playPronunciation(
        this.currentWord.word,
        this.currentWord.pronunciation.audioUrl
      );
    });
    container.add(audioBtn);

    // Hint to flip
    const hintText = this.add.text(0, height / 2 - 30, 'Tap to see meaning', {
      ...TEXT_STYLES.body,
      color: COLOR_STRINGS.TEXT_MUTED,
      fontSize: '14px',
    } as Phaser.Types.GameObjects.Text.TextStyle).setOrigin(0.5);
    container.add(hintText);

    return container;
  }

  private createCardBack(width: number, height: number): Phaser.GameObjects.Container {
    const container = this.add.container(0, 0);

    // Background
    const bg = this.add.rectangle(0, 0, width, height, COLORS.BG_LIGHT)
      .setStrokeStyle(4, COLORS.SECONDARY);
    container.add(bg);

    // Vietnamese meaning
    const meaningText = this.add.text(0, -60, this.currentWord.meaning, {
      ...TEXT_STYLES.title,
      fontSize: '28px',
      color: COLOR_STRINGS.SECONDARY,
      wordWrap: { width: width - 60 },
      align: 'center',
    } as Phaser.Types.GameObjects.Text.TextStyle).setOrigin(0.5);
    container.add(meaningText);

    // Examples (if available)
    if (this.currentWord.examples && this.currentWord.examples.length > 0) {
      const example = this.currentWord.examples[0];

      const exampleLabel = this.add.text(0, 20, 'Example:', {
        ...TEXT_STYLES.body,
        color: COLOR_STRINGS.TEXT_MUTED,
        fontSize: '14px',
      } as Phaser.Types.GameObjects.Text.TextStyle).setOrigin(0.5);
      container.add(exampleLabel);

      // Highlight the word in the example
      const exampleText = this.add.text(0, 50, example.english, {
        ...TEXT_STYLES.body,
        wordWrap: { width: width - 60 },
        align: 'center',
      } as Phaser.Types.GameObjects.Text.TextStyle).setOrigin(0.5);
      container.add(exampleText);

      if (example.vietnamese) {
        const exampleVi = this.add.text(0, 90, example.vietnamese, {
          ...TEXT_STYLES.body,
          color: COLOR_STRINGS.TEXT_MUTED,
          fontSize: '14px',
          wordWrap: { width: width - 60 },
          align: 'center',
        } as Phaser.Types.GameObjects.Text.TextStyle).setOrigin(0.5);
        container.add(exampleVi);
      }
    }

    // Synonyms (if available)
    if (this.currentWord.synonyms && this.currentWord.synonyms.length > 0) {
      const synText = this.add.text(
        0,
        height / 2 - 40,
        `= ${this.currentWord.synonyms.join(' = ')}`,
        {
          ...TEXT_STYLES.body,
          color: COLOR_STRINGS.TEXT_MUTED,
          fontSize: '14px',
        } as Phaser.Types.GameObjects.Text.TextStyle
      ).setOrigin(0.5);
      container.add(synText);
    }

    return container;
  }

  private flipCard(): void {
    if (this.isFlipping) return;
    this.isFlipping = true;

    this.audio.playSoundEffect('click');

    // Flip animation
    this.tweens.add({
      targets: this.card,
      scaleX: 0,
      duration: 150,
      ease: 'Power2',
      onComplete: () => {
        // Swap visibility
        if (this.currentSide === 'front') {
          this.cardFront.setVisible(false);
          this.cardBack.setVisible(true);
          this.currentSide = 'back';
        } else {
          this.cardFront.setVisible(true);
          this.cardBack.setVisible(false);
          this.currentSide = 'front';
        }

        // Flip back
        this.tweens.add({
          targets: this.card,
          scaleX: 1,
          duration: 150,
          ease: 'Power2',
          onComplete: () => {
            this.isFlipping = false;
          },
        });
      },
    });
  }

  private handleKnow(): void {
    // Mark as known (correct)
    this.handleCorrectAnswer(this.currentWord.id, 0);

    // Animate card out to right
    this.animateCardOut('right', () => {
      this.nextWord();
      this.showNextCard();
    });
  }

  private handleLearn(): void {
    // Mark as needs learning (will appear again sooner)
    this.progress.recordAnswer(this.currentWord.id, false, 0);

    // Animate card out to left
    this.animateCardOut('left', () => {
      this.nextWord();
      this.showNextCard();
    });
  }

  private animateCardIn(): void {
    this.card.setAlpha(0);
    this.card.setScale(0.8);
    this.card.y = 400;

    this.tweens.add({
      targets: this.card,
      alpha: 1,
      scale: 1,
      y: 330,
      duration: 300,
      ease: 'Back.easeOut',
    });
  }

  private animateCardOut(direction: 'left' | 'right', onComplete: () => void): void {
    const targetX = direction === 'right' ? GAME_WIDTH + 300 : -300;

    this.tweens.add({
      targets: this.card,
      x: targetX,
      rotation: direction === 'right' ? 0.2 : -0.2,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        this.card.x = GAME_WIDTH / 2;
        this.card.rotation = 0;
        onComplete();
      },
    });
  }
}
