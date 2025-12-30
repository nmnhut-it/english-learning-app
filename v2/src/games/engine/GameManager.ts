/**
 * Game Manager - Main entry point for the vocabulary game system
 */

import Phaser from 'phaser';
import { createGameConfig, SCENES } from '../config/GameConfig';
import type { VocabularySet, GameMode, GameResult } from '../types/GameTypes';

// Import all scenes
import { BootScene } from '../scenes/BootScene';
import { MenuScene } from '../scenes/MenuScene';
import { FlashcardScene } from '../scenes/FlashcardScene';
import { MeaningMatchScene } from '../scenes/MeaningMatchScene';
import { PronunciationScene } from '../scenes/PronunciationScene';
import { WordBlitzScene } from '../scenes/WordBlitzScene';

export interface VocabGameOptions {
  container: string | HTMLElement;
  vocabularySet?: VocabularySet;
  mode?: GameMode;
  onComplete?: (results: GameResult) => void;
  onError?: (error: Error) => void;
}

export class VocabGame {
  private game: Phaser.Game | null = null;
  private options: VocabGameOptions;
  private vocabularySet?: VocabularySet;

  constructor(options: VocabGameOptions) {
    this.options = options;
    this.vocabularySet = options.vocabularySet;
  }

  /**
   * Start the game
   */
  start(): void {
    if (this.game) {
      console.warn('Game already started');
      return;
    }

    try {
      // Get all scenes
      const scenes = [
        BootScene,
        MenuScene,
        FlashcardScene,
        MeaningMatchScene,
        PronunciationScene,
        WordBlitzScene,
      ];

      // Create game config
      const parent = typeof this.options.container === 'string'
        ? this.options.container
        : this.options.container.id;

      const config = createGameConfig(scenes, parent);

      // Create game instance
      this.game = new Phaser.Game(config);

      // Pass data to the first scene after game is ready
      this.game.events.once('ready', () => {
        const menuScene = this.game?.scene.getScene(SCENES.MENU) as MenuScene;
        if (menuScene) {
          menuScene.scene.restart({
            vocabularySet: this.vocabularySet,
            onComplete: this.options.onComplete,
          });
        }
      });
    } catch (error) {
      if (this.options.onError) {
        this.options.onError(error as Error);
      } else {
        console.error('Failed to start game:', error);
      }
    }
  }

  /**
   * Update vocabulary set
   */
  setVocabularySet(vocabularySet: VocabularySet): void {
    this.vocabularySet = vocabularySet;

    if (this.game) {
      // Restart menu with new vocabulary
      this.game.scene.start(SCENES.MENU, {
        vocabularySet: this.vocabularySet,
        onComplete: this.options.onComplete,
      });
    }
  }

  /**
   * Start a specific game mode directly
   */
  startGame(mode: GameMode): void {
    if (!this.game) {
      console.error('Game not initialized. Call start() first.');
      return;
    }

    const sceneMap: Record<GameMode, string> = {
      learn: 'FlashcardScene',
      practice: 'MeaningMatchScene',
      review: 'PronunciationScene',
      compete: 'WordBlitzScene',
    };

    const sceneKey = sceneMap[mode];

    this.game.scene.start(sceneKey, {
      vocabularySet: this.vocabularySet,
      onComplete: this.options.onComplete,
    });
  }

  /**
   * Pause the game
   */
  pause(): void {
    if (this.game) {
      this.game.pause();
    }
  }

  /**
   * Resume the game
   */
  resume(): void {
    if (this.game) {
      this.game.resume();
    }
  }

  /**
   * Destroy the game instance
   */
  destroy(): void {
    if (this.game) {
      this.game.destroy(true);
      this.game = null;
    }
  }

  /**
   * Check if game is running
   */
  isRunning(): boolean {
    return this.game !== null && this.game.isRunning;
  }

  /**
   * Get the Phaser game instance (for advanced usage)
   */
  getGame(): Phaser.Game | null {
    return this.game;
  }
}

// Export for direct scene registration
export const gameScenes = [
  BootScene,
  MenuScene,
  FlashcardScene,
  MeaningMatchScene,
  PronunciationScene,
  WordBlitzScene,
];
