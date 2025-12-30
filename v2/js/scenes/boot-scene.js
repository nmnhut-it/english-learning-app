/**
 * Boot Scene - Loading screen
 */

class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    // Loading text
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, '📖 Vocabulary Games', {
      fontSize: '36px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10, 'Loading...', {
      fontSize: '18px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0.5);

    // Progress bar
    const barWidth = 300;
    const barHeight = 20;
    const x = (GAME_WIDTH - barWidth) / 2;
    const y = GAME_HEIGHT / 2 + 60;

    this.add.rectangle(GAME_WIDTH / 2, y, barWidth, barHeight, COLORS.BG_CARD)
      .setStrokeStyle(2, COLORS.PRIMARY);

    const progressBar = this.add.rectangle(x + 2, y, 0, barHeight - 4, COLORS.PRIMARY)
      .setOrigin(0, 0.5);

    // Animate loading
    this.tweens.add({
      targets: progressBar,
      width: barWidth - 4,
      duration: 500,
      ease: 'Power2',
      onComplete: () => {
        this.time.delayedCall(200, () => {
          this.scene.start('MenuScene');
        });
      },
    });
  }
}
