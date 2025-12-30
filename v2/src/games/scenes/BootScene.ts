/**
 * Boot Scene - Initial loading and asset preparation
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

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.BOOT);
  }

  preload(): void {
    // Create loading bar
    this.createLoadingBar();

    // Note: In a full implementation, we would load assets here
    // For now, we're using emoji and built-in shapes
  }

  create(): void {
    // Transition to menu
    this.time.delayedCall(500, () => {
      this.scene.start(SCENES.MENU);
    });
  }

  private createLoadingBar(): void {
    const barWidth = 400;
    const barHeight = 30;
    const x = (GAME_WIDTH - barWidth) / 2;
    const y = GAME_HEIGHT / 2;

    // Background
    const bgBar = this.add.rectangle(
      GAME_WIDTH / 2,
      y,
      barWidth,
      barHeight,
      COLORS.BG_CARD
    ).setStrokeStyle(2, COLORS.PRIMARY);

    // Progress bar
    const progressBar = this.add.rectangle(
      x + 2,
      y,
      0,
      barHeight - 4,
      COLORS.PRIMARY
    ).setOrigin(0, 0.5);

    // Loading text
    const loadingText = this.add.text(
      GAME_WIDTH / 2,
      y - 50,
      'Loading...',
      TEXT_STYLES.subtitle as Phaser.Types.GameObjects.Text.TextStyle
    ).setOrigin(0.5);

    // Simulate loading progress
    this.tweens.add({
      targets: progressBar,
      width: barWidth - 4,
      duration: 400,
      ease: 'Power2',
    });
  }
}
