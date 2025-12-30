/**
 * Pronunciation Pop Game Scene
 * Players hear a word and select the correct word from options
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

export class PronunciationScene extends BaseScene {
  private wordBubbles: Phaser.GameObjects.Container[] = [];
  private playButton!: Phaser.GameObjects.Container;
  private instructionText!: Phaser.GameObjects.Text;
  private currentWord!: VocabularyItem;
  private answerStartTime: number = 0;
  private isAnswering: boolean = false;
  private hasPlayedAudio: boolean = false;

  constructor() {
    super('PronunciationScene');
  }

  create(): void {
    super.create();

    // Title
    this.add.text(GAME_WIDTH / 2, 90, 'Listen & Select', TEXT_STYLES.subtitle as Phaser.Types.GameObjects.Text.TextStyle)
      .setOrigin(0.5);

    // Instruction
    this.instructionText = this.add.text(
      GAME_WIDTH / 2,
      140,
      'Tap the speaker to hear the word, then select the correct word',
      {
        ...TEXT_STYLES.body,
        color: COLOR_STRINGS.TEXT_MUTED,
        wordWrap: { width: 600 },
        align: 'center',
      } as Phaser.Types.GameObjects.Text.TextStyle
    ).setOrigin(0.5);

    // Start first word
    this.showNextWord();
  }

  private showNextWord(): void {
    if (this.currentIndex >= this.currentWords.length) {
      this.completeGame();
      return;
    }

    this.isAnswering = false;
    this.hasPlayedAudio = false;
    this.currentWord = this.currentWords[this.currentIndex];

    // Clear previous
    this.clearDisplay();

    // Create play button
    this.createPlayButton();

    // Create word bubbles
    this.createWordBubbles();

    // Animate in
    this.animateIn();
  }

  private clearDisplay(): void {
    if (this.playButton) {
      this.playButton.destroy();
    }
    this.wordBubbles.forEach((bubble) => bubble.destroy());
    this.wordBubbles = [];
  }

  private createPlayButton(): void {
    const centerY = 250;

    this.playButton = this.add.container(GAME_WIDTH / 2, centerY);

    // Large circle button
    const circle = this.add.circle(0, 0, 80, COLORS.PRIMARY)
      .setStrokeStyle(4, 0xffffff, 0.3);

    // Speaker icon
    const icon = this.add.text(0, 0, '🔊', {
      fontSize: '48px',
    }).setOrigin(0.5);

    this.playButton.add([circle, icon]);
    this.playButton.setSize(160, 160);
    this.playButton.setInteractive({ useHandCursor: true });

    // Pulsing animation
    this.tweens.add({
      targets: circle,
      scale: { from: 1, to: 1.1 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });

    this.playButton.on('pointerdown', () => {
      this.playPronunciation();
    });
  }

  private playPronunciation(): void {
    // Play the word
    this.audio.playPronunciation(
      this.currentWord.word,
      this.currentWord.pronunciation.audioUrl
    );

    // Enable answering after first play
    if (!this.hasPlayedAudio) {
      this.hasPlayedAudio = true;
      this.answerStartTime = Date.now();
      this.isAnswering = true;

      // Enable bubbles
      this.wordBubbles.forEach((bubble) => {
        bubble.setData('enabled', true);
        const bg = bubble.getData('bg') as Phaser.GameObjects.Arc;
        bg.setStrokeStyle(3, COLORS.PRIMARY);
      });
    }

    // Visual feedback
    this.tweens.add({
      targets: this.playButton,
      scale: { from: 0.9, to: 1 },
      duration: 100,
    });
  }

  private createWordBubbles(): void {
    const options = this.getRandomOptions(this.currentWord, 4);
    const centerY = 450;
    const bubbleRadius = 70;
    const spacing = 170;

    // Position bubbles in 2x2 grid
    const positions = [
      { x: GAME_WIDTH / 2 - spacing / 2, y: centerY - spacing / 3 },
      { x: GAME_WIDTH / 2 + spacing / 2, y: centerY - spacing / 3 },
      { x: GAME_WIDTH / 2 - spacing / 2, y: centerY + spacing / 3 },
      { x: GAME_WIDTH / 2 + spacing / 2, y: centerY + spacing / 3 },
    ];

    options.forEach((option, index) => {
      const pos = positions[index];
      const bubble = this.createWordBubble(
        pos.x,
        pos.y,
        option.word,
        option.id === this.currentWord.id,
        bubbleRadius
      );
      this.wordBubbles.push(bubble);
    });
  }

  private createWordBubble(
    x: number,
    y: number,
    word: string,
    isCorrect: boolean,
    radius: number
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    // Bubble background
    const bg = this.add.circle(0, 0, radius, COLORS.BG_CARD)
      .setStrokeStyle(2, COLORS.TEXT_MUTED);

    // Word text - truncate if too long
    const displayWord = word.length > 12 ? word.substring(0, 10) + '...' : word;
    const fontSize = word.length > 8 ? 14 : 18;

    const label = this.add.text(0, 0, displayWord, {
      ...TEXT_STYLES.body,
      fontSize: `${fontSize}px`,
      wordWrap: { width: radius * 1.6 },
      align: 'center',
    } as Phaser.Types.GameObjects.Text.TextStyle).setOrigin(0.5);

    container.add([bg, label]);
    container.setSize(radius * 2, radius * 2);
    container.setInteractive({ useHandCursor: true });
    container.setAlpha(0);

    // Store data
    container.setData('isCorrect', isCorrect);
    container.setData('bg', bg);
    container.setData('enabled', false);

    container.on('pointerover', () => {
      if (this.isAnswering && container.getData('enabled')) {
        bg.setFillStyle(COLORS.BG_LIGHT);
      }
    });

    container.on('pointerout', () => {
      if (this.isAnswering && container.getData('enabled')) {
        bg.setFillStyle(COLORS.BG_CARD);
      }
    });

    container.on('pointerdown', () => {
      if (this.isAnswering && container.getData('enabled')) {
        this.handleAnswer(container, isCorrect);
      }
    });

    return container;
  }

  private handleAnswer(
    selectedBubble: Phaser.GameObjects.Container,
    isCorrect: boolean
  ): void {
    if (!this.isAnswering) return;
    this.isAnswering = false;

    const timeSpent = Date.now() - this.answerStartTime;
    const selectedBg = selectedBubble.getData('bg') as Phaser.GameObjects.Arc;

    // Disable all bubbles
    this.wordBubbles.forEach((bubble) => {
      bubble.removeInteractive();
      bubble.setData('enabled', false);
    });

    if (isCorrect) {
      // Pop animation for correct answer
      selectedBg.setFillStyle(COLORS.CORRECT);
      this.tweens.add({
        targets: selectedBubble,
        scale: 1.2,
        duration: 150,
        yoyo: true,
      });

      this.handleCorrectAnswer(this.currentWord.id, timeSpent);
    } else {
      // Shake animation for wrong answer
      selectedBg.setFillStyle(COLORS.INCORRECT);
      this.tweens.add({
        targets: selectedBubble,
        x: selectedBubble.x + 10,
        duration: 50,
        yoyo: true,
        repeat: 3,
      });

      // Show correct answer
      const correctBubble = this.wordBubbles.find((b) => b.getData('isCorrect'));
      if (correctBubble) {
        const correctBg = correctBubble.getData('bg') as Phaser.GameObjects.Arc;
        correctBg.setFillStyle(COLORS.CORRECT);
      }

      this.handleIncorrectAnswer(this.currentWord.id);
    }

    // Show the word briefly
    this.showWordReveal();

    // Wait before next word
    this.time.delayedCall(TIMING.ANSWER_FEEDBACK_DURATION + 500, () => {
      this.animateOut(() => {
        this.nextWord();
        this.showNextWord();
      });
    });
  }

  private showWordReveal(): void {
    const revealText = this.add.text(
      GAME_WIDTH / 2,
      250,
      `${this.currentWord.word}\n${this.currentWord.pronunciation.ipa}`,
      {
        ...TEXT_STYLES.word,
        align: 'center',
      } as Phaser.Types.GameObjects.Text.TextStyle
    ).setOrigin(0.5).setAlpha(0);

    // Fade out play button
    this.tweens.add({
      targets: this.playButton,
      alpha: 0,
      duration: 200,
    });

    // Show word
    this.tweens.add({
      targets: revealText,
      alpha: 1,
      duration: 200,
    });
  }

  private animateIn(): void {
    // Play button
    this.playButton.setAlpha(0);
    this.playButton.setScale(0.5);
    this.tweens.add({
      targets: this.playButton,
      alpha: 1,
      scale: 1,
      duration: 300,
      ease: 'Back.easeOut',
    });

    // Bubbles
    this.wordBubbles.forEach((bubble, index) => {
      bubble.setScale(0.5);
      this.tweens.add({
        targets: bubble,
        alpha: 1,
        scale: 1,
        delay: 200 + index * 100,
        duration: 300,
        ease: 'Back.easeOut',
      });
    });
  }

  private animateOut(onComplete: () => void): void {
    const targets = [this.playButton, ...this.wordBubbles];

    this.tweens.add({
      targets,
      alpha: 0,
      scale: 0.8,
      duration: 200,
      ease: 'Power2',
      onComplete,
    });
  }
}
