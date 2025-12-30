/**
 * Menu Scene - Game mode selection
 */

class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    const vocabSet = getCurrentVocabSet();

    // Background grid
    this.createBackground();

    // Title
    this.add.text(GAME_WIDTH / 2, 50, '📖 Vocabulary Games', {
      fontSize: '32px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Vocabulary set selector
    this.createVocabSelector(vocabSet);

    // Stats
    const stats = ProgressTracker.getStats();
    this.add.text(GAME_WIDTH / 2, 130, `⭐ ${stats.totalPoints} pts | 🔥 ${stats.currentStreak} streak | 📚 ${stats.totalWordsLearned} words`, {
      fontSize: '14px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0.5);

    // Game mode cards
    const modes = [
      { key: 'FlashcardScene', title: '📚 Learn', desc: 'Study with flashcards', color: COLORS.PRIMARY },
      { key: 'MeaningMatchScene', title: '🎯 Meaning Match', desc: 'Match words to meanings', color: COLORS.SECONDARY },
      { key: 'PronunciationScene', title: '🔊 Listen & Select', desc: 'Hear and identify words', color: 0x06b6d4 },
      { key: 'WordBlitzScene', title: '⚡ Word Blitz', desc: 'Timed matching game', color: COLORS.WARNING },
    ];

    modes.forEach((mode, i) => {
      this.createModeCard(GAME_WIDTH / 2, 200 + i * 95, mode);
    });

    // Footer
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 30, 'Chạm vào game mode để bắt đầu! 🎮', {
      fontSize: '14px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0.5);

    // Update streak
    ProgressTracker.updateStreak();
  }

  createBackground() {
    const graphics = this.add.graphics();
    graphics.lineStyle(1, COLORS.BG_CARD, 0.3);
    for (let x = 0; x < GAME_WIDTH; x += 50) {
      graphics.lineBetween(x, 0, x, GAME_HEIGHT);
    }
    for (let y = 0; y < GAME_HEIGHT; y += 50) {
      graphics.lineBetween(0, y, GAME_WIDTH, y);
    }
  }

  createVocabSelector(vocabSet) {
    const sets = getAllVocabSets();
    const y = 90;

    // Current set display
    const setDisplay = this.add.container(GAME_WIDTH / 2, y);

    const bg = this.add.rectangle(0, 0, 400, 35, COLORS.BG_CARD)
      .setStrokeStyle(2, COLORS.SECONDARY);

    const text = this.add.text(0, 0, `${vocabSet.title} (${vocabSet.items.length} words)`, {
      fontSize: '16px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.SECONDARY,
    }).setOrigin(0.5);

    // Arrows
    const leftArrow = this.add.text(-180, 0, '◀', {
      fontSize: '20px',
      color: COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    const rightArrow = this.add.text(180, 0, '▶', {
      fontSize: '20px',
      color: COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    setDisplay.add([bg, text, leftArrow, rightArrow]);

    // Navigation
    let currentIndex = sets.findIndex(s => s.id === vocabSet.id);

    const updateDisplay = () => {
      const set = sets[currentIndex];
      setCurrentVocabSet(set.id);
      text.setText(`${set.title} (${set.items.length} words)`);
    };

    leftArrow.on('pointerdown', () => {
      currentIndex = (currentIndex - 1 + sets.length) % sets.length;
      updateDisplay();
      AudioManager.playEffect('click');
    });

    rightArrow.on('pointerdown', () => {
      currentIndex = (currentIndex + 1) % sets.length;
      updateDisplay();
      AudioManager.playEffect('click');
    });
  }

  createModeCard(x, y, mode) {
    const container = this.add.container(x, y);
    const width = 650;
    const height = 80;

    const bg = this.add.rectangle(0, 0, width, height, COLORS.BG_CARD)
      .setStrokeStyle(2, mode.color);

    const title = this.add.text(-width / 2 + 30, -12, mode.title, {
      fontSize: '22px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT,
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    const desc = this.add.text(-width / 2 + 30, 15, mode.desc, {
      fontSize: '14px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0, 0.5);

    const arrow = this.add.text(width / 2 - 30, 0, '▶', {
      fontSize: '24px',
      color: COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0.5);

    container.add([bg, title, desc, arrow]);
    container.setSize(width, height);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => {
      bg.setFillStyle(COLORS.BG_LIGHT);
      bg.setStrokeStyle(3, mode.color);
      this.tweens.add({ targets: container, x: x + 5, duration: 100 });
    });

    container.on('pointerout', () => {
      bg.setFillStyle(COLORS.BG_CARD);
      bg.setStrokeStyle(2, mode.color);
      this.tweens.add({ targets: container, x: x, duration: 100 });
    });

    container.on('pointerdown', () => {
      AudioManager.playEffect('click');
      this.scene.start(mode.key);
    });
  }
}
