/**
 * Main entry point - Phaser game configuration
 */

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Game configuration
  const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: COLORS.BACKGROUND,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [
      BootScene,
      MenuScene,
      LessonSelectScene,
      FlashcardScene,
      MeaningMatchScene,
      PronunciationScene,
      WordBlitzScene,
      DailyChallengeScene,
    ],
  };

  // Create game instance
  const game = new Phaser.Game(config);

  // Handle visibility change (pause audio when tab hidden)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      AudioManager.synth.cancel();
    }
  });

  // Log startup
  console.log('📖 Vocabulary Games initialized');
  console.log(`📚 Loaded ${getAllVocabSets().length} vocabulary sets`);

  const stats = ProgressTracker.getStats();
  console.log(`⭐ Total points: ${stats.totalPoints}`);
  console.log(`🔥 Current streak: ${stats.currentStreak} days`);
});
