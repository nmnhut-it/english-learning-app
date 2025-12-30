/**
 * Menu Scene - Game mode selection
 */

import Phaser from 'phaser';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  COLORS,
  COLOR_STRINGS,
  TEXT_STYLES,
  SCENES,
} from '../config/GameConfig';
import type { VocabularySet, GameMode } from '../types/GameTypes';

interface MenuSceneData {
  vocabularySet?: VocabularySet;
  onComplete?: (results: any) => void;
}

interface GameModeOption {
  key: string;
  title: string;
  description: string;
  icon: string;
  color: number;
}

export class MenuScene extends Phaser.Scene {
  private vocabularySet?: VocabularySet;
  private onCompleteCallback?: (results: any) => void;

  private readonly gameModes: GameModeOption[] = [
    {
      key: 'FlashcardScene',
      title: 'Learn',
      description: 'Study vocabulary with flashcards',
      icon: '📚',
      color: COLORS.PRIMARY,
    },
    {
      key: 'MeaningMatchScene',
      title: 'Meaning Match',
      description: 'Match words to meanings',
      icon: '🎯',
      color: COLORS.SECONDARY,
    },
    {
      key: 'PronunciationScene',
      title: 'Pronunciation',
      description: 'Listen and identify words',
      icon: '🔊',
      color: 0x06b6d4,
    },
    {
      key: 'WordBlitzScene',
      title: 'Word Blitz',
      description: 'Timed matching challenge',
      icon: '⚡',
      color: COLORS.WARNING,
    },
  ];

  constructor() {
    super(SCENES.MENU);
  }

  init(data: MenuSceneData): void {
    this.vocabularySet = data.vocabularySet;
    this.onCompleteCallback = data.onComplete;
  }

  create(): void {
    // Background pattern
    this.createBackground();

    // Title
    this.add.text(GAME_WIDTH / 2, 60, '📖 Vocabulary Games', {
      ...TEXT_STYLES.title,
      fontSize: '36px',
    } as Phaser.Types.GameObjects.Text.TextStyle).setOrigin(0.5);

    // Vocabulary set info
    if (this.vocabularySet) {
      this.add.text(
        GAME_WIDTH / 2,
        110,
        `${this.vocabularySet.title} • ${this.vocabularySet.items.length} words`,
        {
          ...TEXT_STYLES.body,
          color: COLOR_STRINGS.TEXT_MUTED,
        } as Phaser.Types.GameObjects.Text.TextStyle
      ).setOrigin(0.5);
    } else {
      this.add.text(
        GAME_WIDTH / 2,
        110,
        'Select a game mode to practice vocabulary',
        {
          ...TEXT_STYLES.body,
          color: COLOR_STRINGS.TEXT_MUTED,
        } as Phaser.Types.GameObjects.Text.TextStyle
      ).setOrigin(0.5);
    }

    // Game mode cards
    this.createGameModeCards();

    // Footer
    this.createFooter();
  }

  private createBackground(): void {
    // Subtle grid pattern
    const graphics = this.add.graphics();
    graphics.lineStyle(1, COLORS.BG_CARD, 0.3);

    for (let x = 0; x < GAME_WIDTH; x += 50) {
      graphics.lineBetween(x, 0, x, GAME_HEIGHT);
    }
    for (let y = 0; y < GAME_HEIGHT; y += 50) {
      graphics.lineBetween(0, y, GAME_WIDTH, y);
    }
  }

  private createGameModeCards(): void {
    const startY = 180;
    const cardHeight = 90;
    const cardWidth = 700;
    const spacing = 100;

    this.gameModes.forEach((mode, index) => {
      const y = startY + index * spacing;
      this.createModeCard(GAME_WIDTH / 2, y, mode, cardWidth, cardHeight);
    });
  }

  private createModeCard(
    x: number,
    y: number,
    mode: GameModeOption,
    width: number,
    height: number
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    // Card background
    const bg = this.add.rectangle(0, 0, width, height, COLORS.BG_CARD)
      .setStrokeStyle(2, mode.color);

    // Icon
    const icon = this.add.text(-width / 2 + 50, 0, mode.icon, {
      fontSize: '40px',
    }).setOrigin(0.5);

    // Title
    const title = this.add.text(-width / 2 + 120, -15, mode.title, {
      ...TEXT_STYLES.word,
      fontSize: '22px',
    } as Phaser.Types.GameObjects.Text.TextStyle).setOrigin(0, 0.5);

    // Description
    const description = this.add.text(-width / 2 + 120, 15, mode.description, {
      ...TEXT_STYLES.body,
      color: COLOR_STRINGS.TEXT_MUTED,
    } as Phaser.Types.GameObjects.Text.TextStyle).setOrigin(0, 0.5);

    // Play arrow
    const arrow = this.add.text(width / 2 - 50, 0, '▶', {
      fontSize: '24px',
      color: COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0.5);

    container.add([bg, icon, title, description, arrow]);
    container.setSize(width, height);
    container.setInteractive({ useHandCursor: true });

    // Hover effects
    container.on('pointerover', () => {
      bg.setFillStyle(COLORS.BG_LIGHT);
      bg.setStrokeStyle(3, mode.color);
      arrow.setStyle({ color: COLOR_STRINGS.TEXT });

      this.tweens.add({
        targets: container,
        x: x + 5,
        duration: 100,
      });
    });

    container.on('pointerout', () => {
      bg.setFillStyle(COLORS.BG_CARD);
      bg.setStrokeStyle(2, mode.color);
      arrow.setStyle({ color: COLOR_STRINGS.TEXT_MUTED });

      this.tweens.add({
        targets: container,
        x: x,
        duration: 100,
      });
    });

    container.on('pointerdown', () => {
      this.launchGame(mode.key);
    });

    return container;
  }

  private createFooter(): void {
    const y = GAME_HEIGHT - 30;

    // Stats summary (if we have progress data)
    this.add.text(
      GAME_WIDTH / 2,
      y,
      'Practice daily to improve your vocabulary! 🎯',
      {
        ...TEXT_STYLES.body,
        color: COLOR_STRINGS.TEXT_MUTED,
        fontSize: '14px',
      } as Phaser.Types.GameObjects.Text.TextStyle
    ).setOrigin(0.5);
  }

  private launchGame(sceneKey: string): void {
    if (!this.vocabularySet || this.vocabularySet.items.length === 0) {
      // Show error - no vocabulary loaded
      this.showNoVocabularyError();
      return;
    }

    this.scene.start(sceneKey, {
      vocabularySet: this.vocabularySet,
      onComplete: (results: any) => {
        // Return to menu after game
        this.scene.start(SCENES.MENU, {
          vocabularySet: this.vocabularySet,
          onComplete: this.onCompleteCallback,
        });

        if (this.onCompleteCallback) {
          this.onCompleteCallback(results);
        }
      },
    });
  }

  private showNoVocabularyError(): void {
    const overlay = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x000000,
      0.7
    );

    const card = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      400,
      200,
      COLORS.BG_CARD
    ).setStrokeStyle(3, COLORS.INCORRECT);

    this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 - 40,
      '⚠️ No Vocabulary Loaded',
      TEXT_STYLES.title as Phaser.Types.GameObjects.Text.TextStyle
    ).setOrigin(0.5);

    this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 + 10,
      'Please select a unit to practice.',
      TEXT_STYLES.body as Phaser.Types.GameObjects.Text.TextStyle
    ).setOrigin(0.5);

    // Close after delay
    this.time.delayedCall(2000, () => {
      overlay.destroy();
      card.destroy();
    });
  }
}
