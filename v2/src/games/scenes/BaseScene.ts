/**
 * Base Scene - Common functionality for all game scenes
 */

import Phaser from 'phaser';
import { getAudioManager, AudioManager } from '../engine/AudioManager';
import { ProgressTracker } from '../data/ProgressTracker';
import type { VocabularyItem, VocabularySet } from '../types/GameTypes';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  COLORS,
  COLOR_STRINGS,
  TEXT_STYLES,
  POINTS,
  TIMING,
} from '../config/GameConfig';

export interface BaseSceneData {
  vocabularySet: VocabularySet;
  onComplete?: (results: GameResults) => void;
}

export interface GameResults {
  score: number;
  correctCount: number;
  incorrectCount: number;
  timeSpent: number;
  perfectGame: boolean;
  streak: number;
  wordsReviewed: string[];
}

export abstract class BaseScene extends Phaser.Scene {
  protected audio: AudioManager;
  protected progress: ProgressTracker;
  protected vocabularySet!: VocabularySet;
  protected currentWords: VocabularyItem[] = [];
  protected currentIndex: number = 0;

  // Game state
  protected score: number = 0;
  protected correctCount: number = 0;
  protected incorrectCount: number = 0;
  protected streak: number = 0;
  protected maxStreak: number = 0;
  protected startTime: number = 0;

  // UI elements
  protected scoreText!: Phaser.GameObjects.Text;
  protected streakText!: Phaser.GameObjects.Text;
  protected progressBar!: Phaser.GameObjects.Graphics;
  protected progressText!: Phaser.GameObjects.Text;

  // Callbacks
  protected onCompleteCallback?: (results: GameResults) => void;

  constructor(key: string) {
    super(key);
    this.audio = getAudioManager();
    this.progress = new ProgressTracker();
  }

  init(data: BaseSceneData): void {
    this.vocabularySet = data.vocabularySet;
    this.onCompleteCallback = data.onComplete;

    // Reset state
    this.score = 0;
    this.correctCount = 0;
    this.incorrectCount = 0;
    this.streak = 0;
    this.maxStreak = 0;
    this.currentIndex = 0;
    this.startTime = Date.now();

    // Get words for this session
    this.currentWords = this.getWordsForSession();
  }

  /**
   * Override to customize word selection
   */
  protected getWordsForSession(): VocabularyItem[] {
    return this.progress.getWordsForReview(this.vocabularySet, 20);
  }

  create(): void {
    // Initialize audio
    this.audio.init();
    this.audio.resume();

    // Create common UI
    this.createTopBar();
    this.createProgressBar();

    // Update streak
    this.progress.updateStreak();
  }

  // ==================== UI Components ====================

  protected createTopBar(): void {
    const barHeight = 60;

    // Background
    this.add.rectangle(GAME_WIDTH / 2, barHeight / 2, GAME_WIDTH, barHeight, COLORS.BG_CARD);

    // Score
    this.add.text(20, barHeight / 2, '⭐', {
      fontSize: '24px',
    }).setOrigin(0, 0.5);

    this.scoreText = this.add.text(50, barHeight / 2, '0', TEXT_STYLES.score as Phaser.Types.GameObjects.Text.TextStyle)
      .setOrigin(0, 0.5);

    // Streak
    this.add.text(GAME_WIDTH - 120, barHeight / 2, '🔥', {
      fontSize: '24px',
    }).setOrigin(0, 0.5);

    this.streakText = this.add.text(GAME_WIDTH - 90, barHeight / 2, '0', TEXT_STYLES.streak as Phaser.Types.GameObjects.Text.TextStyle)
      .setOrigin(0, 0.5);

    // Back button
    this.createButton(GAME_WIDTH - 40, barHeight / 2, '←', () => {
      this.handleExit();
    }, 40, 40);
  }

  protected createProgressBar(): void {
    const y = GAME_HEIGHT - 40;
    const barWidth = GAME_WIDTH - 100;
    const barHeight = 20;
    const x = 50;

    // Background
    this.add.rectangle(x + barWidth / 2, y, barWidth, barHeight, COLORS.BG_CARD)
      .setStrokeStyle(2, COLORS.SECONDARY);

    // Progress fill
    this.progressBar = this.add.graphics();
    this.updateProgressBar();

    // Progress text
    this.progressText = this.add.text(GAME_WIDTH / 2, y, `0/${this.currentWords.length}`, TEXT_STYLES.body as Phaser.Types.GameObjects.Text.TextStyle)
      .setOrigin(0.5);
  }

  protected updateProgressBar(): void {
    if (!this.progressBar) return;

    const y = GAME_HEIGHT - 40;
    const barWidth = GAME_WIDTH - 100;
    const barHeight = 16;
    const x = 52;

    const progress = this.currentIndex / this.currentWords.length;
    const fillWidth = barWidth * progress;

    this.progressBar.clear();
    this.progressBar.fillStyle(COLORS.PRIMARY, 1);
    this.progressBar.fillRoundedRect(x, y - barHeight / 2, fillWidth, barHeight, 8);

    if (this.progressText) {
      this.progressText.setText(`${this.currentIndex}/${this.currentWords.length}`);
    }
  }

  // ==================== Button Helper ====================

  protected createButton(
    x: number,
    y: number,
    text: string,
    onClick: () => void,
    width: number = 200,
    height: number = 50,
    color: number = COLORS.PRIMARY
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, width, height, color)
      .setStrokeStyle(2, 0xffffff, 0.2);

    const label = this.add.text(0, 0, text, TEXT_STYLES.button as Phaser.Types.GameObjects.Text.TextStyle)
      .setOrigin(0.5);

    container.add([bg, label]);
    container.setSize(width, height);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => {
      bg.setFillStyle(Phaser.Display.Color.ValueToColor(color).lighten(20).color);
    });

    container.on('pointerout', () => {
      bg.setFillStyle(color);
    });

    container.on('pointerdown', () => {
      this.audio.playSoundEffect('click');
      onClick();
    });

    return container;
  }

  // ==================== Card Component ====================

  protected createWordCard(
    x: number,
    y: number,
    item: VocabularyItem,
    showMeaning: boolean = false
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    // Card background
    const cardWidth = 400;
    const cardHeight = showMeaning ? 200 : 150;

    const bg = this.add.rectangle(0, 0, cardWidth, cardHeight, COLORS.BG_CARD)
      .setStrokeStyle(3, COLORS.PRIMARY);

    container.add(bg);

    // Word
    const wordText = this.add.text(0, showMeaning ? -40 : -20, item.word, TEXT_STYLES.word as Phaser.Types.GameObjects.Text.TextStyle)
      .setOrigin(0.5);
    container.add(wordText);

    // IPA
    const ipaText = this.add.text(0, showMeaning ? 0 : 20, item.pronunciation.ipa, TEXT_STYLES.pronunciation as Phaser.Types.GameObjects.Text.TextStyle)
      .setOrigin(0.5);
    container.add(ipaText);

    // Audio button
    const audioBtn = this.createButton(cardWidth / 2 - 40, showMeaning ? -40 : -20, '🔊', () => {
      this.audio.playPronunciation(item.word, item.pronunciation.audioUrl);
    }, 50, 50);
    container.add(audioBtn);

    // Meaning (if shown)
    if (showMeaning) {
      const meaningText = this.add.text(0, 50, item.meaning, TEXT_STYLES.meaning as Phaser.Types.GameObjects.Text.TextStyle)
        .setOrigin(0.5)
        .setWordWrapWidth(cardWidth - 40);
      container.add(meaningText);
    }

    return container;
  }

  // ==================== Answer Handling ====================

  protected handleCorrectAnswer(wordId: string, timeSpent: number = 0): void {
    this.correctCount++;
    this.streak++;
    this.maxStreak = Math.max(this.maxStreak, this.streak);

    // Calculate points
    let points = POINTS.CORRECT_ANSWER;

    // First try bonus
    points = POINTS.CORRECT_FIRST_TRY;

    // Fast answer bonus
    if (timeSpent > 0 && timeSpent < TIMING.FAST_ANSWER_THRESHOLD) {
      points += POINTS.FAST_ANSWER_BONUS;
    }

    // Streak multiplier
    if (this.streak >= 5) {
      points = Math.floor(points * POINTS.STREAK_MULTIPLIER);
    }

    this.score += points;
    this.updateScoreDisplay();

    // Record in progress tracker
    this.progress.recordAnswer(wordId, true, timeSpent);
    this.progress.addPoints(points);

    // Play sound
    this.audio.playSoundEffect('correct');

    // Show feedback
    this.showFeedback(true);
  }

  protected handleIncorrectAnswer(wordId: string): void {
    this.incorrectCount++;
    this.streak = 0;

    // Record in progress tracker
    this.progress.recordAnswer(wordId, false, 0);

    // Play sound
    this.audio.playSoundEffect('incorrect');

    // Show feedback
    this.showFeedback(false);
  }

  protected updateScoreDisplay(): void {
    if (this.scoreText) {
      this.scoreText.setText(this.score.toString());
    }
    if (this.streakText) {
      this.streakText.setText(this.streak.toString());

      // Animate streak on combo
      if (this.streak >= 3) {
        this.tweens.add({
          targets: this.streakText,
          scale: { from: 1.5, to: 1 },
          duration: 200,
          ease: 'Power2',
        });
      }
    }
  }

  protected showFeedback(correct: boolean): void {
    const color = correct ? COLORS.CORRECT : COLORS.INCORRECT;
    const text = correct ? '✓' : '✗';

    const feedback = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, text, {
      fontSize: '80px',
      color: correct ? COLOR_STRINGS.CORRECT : COLOR_STRINGS.INCORRECT,
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: feedback,
      alpha: 1,
      scale: { from: 0.5, to: 1.2 },
      duration: 200,
      ease: 'Power2',
      yoyo: true,
      onComplete: () => feedback.destroy(),
    });
  }

  // ==================== Game Flow ====================

  protected nextWord(): void {
    this.currentIndex++;
    this.updateProgressBar();

    if (this.currentIndex >= this.currentWords.length) {
      this.completeGame();
    }
  }

  protected completeGame(): void {
    const timeSpent = Date.now() - this.startTime;
    const perfectGame = this.incorrectCount === 0;

    // Bonus for perfect game
    if (perfectGame && this.currentWords.length > 0) {
      this.score += POINTS.PERFECT_LESSON;
      this.progress.addPoints(POINTS.PERFECT_LESSON);
    }

    // Completion bonus
    this.score += POINTS.COMPLETE_LESSON;
    this.progress.addPoints(POINTS.COMPLETE_LESSON);

    this.audio.playSoundEffect('complete');

    const results: GameResults = {
      score: this.score,
      correctCount: this.correctCount,
      incorrectCount: this.incorrectCount,
      timeSpent,
      perfectGame,
      streak: this.maxStreak,
      wordsReviewed: this.currentWords.map((w) => w.id),
    };

    // Show results or callback
    if (this.onCompleteCallback) {
      this.onCompleteCallback(results);
    } else {
      this.showResults(results);
    }
  }

  protected showResults(results: GameResults): void {
    // Overlay
    const overlay = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x000000,
      0.8
    );

    // Results card
    const cardWidth = 400;
    const cardHeight = 350;
    const card = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      cardWidth,
      cardHeight,
      COLORS.BG_CARD
    ).setStrokeStyle(3, COLORS.PRIMARY);

    // Title
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 140, '🎉 Complete!', TEXT_STYLES.title as Phaser.Types.GameObjects.Text.TextStyle)
      .setOrigin(0.5);

    // Stats
    const stats = [
      `⭐ Score: ${results.score}`,
      `✓ Correct: ${results.correctCount}`,
      `✗ Incorrect: ${results.incorrectCount}`,
      `🔥 Best Streak: ${results.streak}`,
      results.perfectGame ? '👑 Perfect!' : '',
    ].filter(Boolean);

    stats.forEach((stat, i) => {
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60 + i * 35, stat, TEXT_STYLES.body as Phaser.Types.GameObjects.Text.TextStyle)
        .setOrigin(0.5);
    });

    // Continue button
    this.createButton(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 120, 'Continue', () => {
      this.handleExit();
    });
  }

  protected handleExit(): void {
    this.scene.stop();
    // Could transition to menu or callback
  }

  // ==================== Utility Methods ====================

  protected shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  protected getRandomOptions(
    correctItem: VocabularyItem,
    count: number = 4
  ): VocabularyItem[] {
    const others = this.vocabularySet.items.filter(
      (item) => item.id !== correctItem.id
    );

    const shuffled = this.shuffle(others).slice(0, count - 1);
    const options = [...shuffled, correctItem];

    return this.shuffle(options);
  }
}
