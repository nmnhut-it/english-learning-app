/**
 * Meaning Match Game Scene
 * Players match English words to their Vietnamese meanings
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
  TIMING,
} from '../config/GameConfig';

export class MeaningMatchScene extends BaseScene {
  private wordCard!: Phaser.GameObjects.Container;
  private optionButtons: Phaser.GameObjects.Container[] = [];
  private currentWord!: VocabularyItem;
  private answerStartTime: number = 0;
  private isAnswering: boolean = false;

  constructor() {
    super('MeaningMatchScene');
  }

  create(): void {
    super.create();

    // Title
    this.add.text(GAME_WIDTH / 2, 90, 'Match the Meaning', TEXT_STYLES.subtitle as Phaser.Types.GameObjects.Text.TextStyle)
      .setOrigin(0.5);

    // Start first word
    this.showNextWord();
  }

  private showNextWord(): void {
    if (this.currentIndex >= this.currentWords.length) {
      this.completeGame();
      return;
    }

    this.isAnswering = true;
    this.answerStartTime = Date.now();
    this.currentWord = this.currentWords[this.currentIndex];

    // Clear previous
    this.clearWordDisplay();

    // Create word card
    this.wordCard = this.createWordCard(GAME_WIDTH / 2, 200, this.currentWord, false);

    // Auto-play pronunciation
    this.audio.playPronunciation(this.currentWord.word, this.currentWord.pronunciation.audioUrl);

    // Create answer options
    this.createOptions();

    // Animate in
    this.animateIn();
  }

  private clearWordDisplay(): void {
    if (this.wordCard) {
      this.wordCard.destroy();
    }
    this.optionButtons.forEach((btn) => btn.destroy());
    this.optionButtons = [];
  }

  private createOptions(): void {
    const options = this.getRandomMeaningOptions(this.currentWord, 4);
    const startY = 350;
    const buttonWidth = 350;
    const buttonHeight = 60;
    const spacing = 70;

    options.forEach((option, index) => {
      const y = startY + index * spacing;
      const button = this.createOptionButton(
        GAME_WIDTH / 2,
        y,
        option.meaning,
        option.id === this.currentWord.id,
        buttonWidth,
        buttonHeight
      );
      this.optionButtons.push(button);
    });
  }

  private createOptionButton(
    x: number,
    y: number,
    text: string,
    isCorrect: boolean,
    width: number,
    height: number
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, width, height, COLORS.BG_CARD)
      .setStrokeStyle(2, COLORS.SECONDARY);

    // Truncate long text
    const displayText = text.length > 40 ? text.substring(0, 37) + '...' : text;

    const label = this.add.text(0, 0, displayText, {
      ...TEXT_STYLES.body,
      wordWrap: { width: width - 40 },
    } as Phaser.Types.GameObjects.Text.TextStyle).setOrigin(0.5);

    container.add([bg, label]);
    container.setSize(width, height);
    container.setInteractive({ useHandCursor: true });
    container.setAlpha(0);

    // Store correct flag on container
    container.setData('isCorrect', isCorrect);
    container.setData('bg', bg);

    container.on('pointerover', () => {
      if (this.isAnswering) {
        bg.setStrokeStyle(3, COLORS.PRIMARY);
      }
    });

    container.on('pointerout', () => {
      if (this.isAnswering) {
        bg.setStrokeStyle(2, COLORS.SECONDARY);
      }
    });

    container.on('pointerdown', () => {
      if (this.isAnswering) {
        this.handleAnswer(container, isCorrect);
      }
    });

    return container;
  }

  private handleAnswer(
    selectedButton: Phaser.GameObjects.Container,
    isCorrect: boolean
  ): void {
    if (!this.isAnswering) return;
    this.isAnswering = false;

    const timeSpent = Date.now() - this.answerStartTime;
    const selectedBg = selectedButton.getData('bg') as Phaser.GameObjects.Rectangle;

    // Disable all buttons
    this.optionButtons.forEach((btn) => {
      btn.removeInteractive();
    });

    if (isCorrect) {
      // Highlight correct answer
      selectedBg.setFillStyle(COLORS.CORRECT);
      this.handleCorrectAnswer(this.currentWord.id, timeSpent);
    } else {
      // Highlight wrong answer
      selectedBg.setFillStyle(COLORS.INCORRECT);

      // Show correct answer
      const correctBtn = this.optionButtons.find((btn) => btn.getData('isCorrect'));
      if (correctBtn) {
        const correctBg = correctBtn.getData('bg') as Phaser.GameObjects.Rectangle;
        correctBg.setFillStyle(COLORS.CORRECT);
      }

      this.handleIncorrectAnswer(this.currentWord.id);
    }

    // Wait before next word
    this.time.delayedCall(TIMING.ANSWER_FEEDBACK_DURATION, () => {
      this.animateOut(() => {
        this.nextWord();
        this.showNextWord();
      });
    });
  }

  private getRandomMeaningOptions(
    correctItem: VocabularyItem,
    count: number
  ): { id: string; meaning: string }[] {
    const correctOption = { id: correctItem.id, meaning: correctItem.meaning };

    // Get other meanings from the vocabulary set
    const others = this.vocabularySet.items
      .filter((item) => item.id !== correctItem.id)
      .map((item) => ({ id: item.id, meaning: item.meaning }));

    const shuffledOthers = this.shuffle(others).slice(0, count - 1);
    const allOptions = [...shuffledOthers, correctOption];

    return this.shuffle(allOptions);
  }

  private animateIn(): void {
    // Word card
    this.wordCard.setAlpha(0);
    this.wordCard.setScale(0.8);
    this.tweens.add({
      targets: this.wordCard,
      alpha: 1,
      scale: 1,
      duration: 300,
      ease: 'Back.easeOut',
    });

    // Options
    this.optionButtons.forEach((btn, index) => {
      this.tweens.add({
        targets: btn,
        alpha: 1,
        delay: 100 + index * 50,
        duration: 200,
        ease: 'Power2',
      });
    });
  }

  private animateOut(onComplete: () => void): void {
    const targets = [this.wordCard, ...this.optionButtons];

    this.tweens.add({
      targets,
      alpha: 0,
      duration: 200,
      ease: 'Power2',
      onComplete,
    });
  }
}
