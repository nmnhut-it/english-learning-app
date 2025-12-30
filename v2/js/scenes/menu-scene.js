/**
 * Menu Scene - Game mode selection (Vietnamese)
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
    this.add.text(GAME_WIDTH / 2, 40, '📖 ' + LANG.appTitle, {
      fontSize: '28px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Current vocab set display
    this.createVocabDisplay(vocabSet);

    // Stats
    const stats = ProgressTracker.getStats();
    this.add.text(GAME_WIDTH / 2, 115, `⭐ ${stats.totalPoints} ${LANG.points} | 🔥 ${stats.currentStreak} ${LANG.streak} | 📚 ${stats.totalWordsLearned} ${LANG.words}`, {
      fontSize: '13px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0.5);

    // Game mode cards
    const modes = [
      { key: 'FlashcardScene', title: LANG.modes.flashcard.title, desc: LANG.modes.flashcard.desc, color: COLORS.PRIMARY, hotkey: '1' },
      { key: 'MeaningMatchScene', title: LANG.modes.meaningMatch.title, desc: LANG.modes.meaningMatch.desc, color: COLORS.SECONDARY, hotkey: '2' },
      { key: 'PronunciationScene', title: LANG.modes.pronunciation.title, desc: LANG.modes.pronunciation.desc, color: 0x06b6d4, hotkey: '3' },
      { key: 'WordBlitzScene', title: LANG.modes.wordBlitz.title, desc: LANG.modes.wordBlitz.desc, color: COLORS.WARNING, hotkey: '4' },
      { key: 'DailyChallengeScene', title: LANG.modes.dailyChallenge.title, desc: LANG.modes.dailyChallenge.desc, color: COLORS.STREAK, hotkey: '5' },
      { key: 'ClassroomBattleScene', title: '🏆 Thi Đấu Lớp Học', desc: 'Chơi theo nhóm, chuyền bàn phím', color: COLORS.GOLD, hotkey: '6' },
    ];

    modes.forEach((mode, i) => {
      this.createModeCard(GAME_WIDTH / 2, 150 + i * 70, mode);
    });

    // Footer with keyboard hints
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 25, '1-6: Chọn mode | L: Đổi bài | ' + LANG.footer, {
      fontSize: '12px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0.5);

    // Keyboard shortcuts
    this.setupKeyboard(modes);

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

  createVocabDisplay(vocabSet) {
    const y = 78;

    // Current set display - clickable to change lesson
    const setDisplay = this.add.container(GAME_WIDTH / 2, y);

    const bg = this.add.rectangle(0, 0, 500, 32, COLORS.BG_CARD)
      .setStrokeStyle(2, COLORS.SECONDARY);

    const text = this.add.text(0, 0, `📘 ${vocabSet.title} (${vocabSet.items.length} từ)`, {
      fontSize: '15px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.SECONDARY,
    }).setOrigin(0.5);

    const changeBtn = this.add.text(220, 0, '[Đổi bài]', {
      fontSize: '12px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

    setDisplay.add([bg, text, changeBtn]);
    setDisplay.setSize(500, 32);
    setDisplay.setInteractive({ useHandCursor: true });

    // Click to open lesson selector
    setDisplay.on('pointerdown', () => {
      AudioManager.playEffect('click');
      this.scene.start('LessonSelectScene');
    });

    changeBtn.on('pointerover', () => changeBtn.setColor(COLOR_STRINGS.SECONDARY));
    changeBtn.on('pointerout', () => changeBtn.setColor(COLOR_STRINGS.TEXT_MUTED));
  }

  setupKeyboard(modes) {
    // Number keys 1-5 for game modes
    modes.forEach((mode, i) => {
      this.input.keyboard.on(`keydown-${mode.hotkey}`, () => {
        AudioManager.playEffect('click');
        this.scene.start(mode.key);
      });
    });

    // L key to open lesson selector
    this.input.keyboard.on('keydown-L', () => {
      AudioManager.playEffect('click');
      this.scene.start('LessonSelectScene');
    });
  }

  createModeCard(x, y, mode) {
    const container = this.add.container(x, y);
    const width = 650;
    const height = 62;

    const bg = this.add.rectangle(0, 0, width, height, COLORS.BG_CARD)
      .setStrokeStyle(2, mode.color);

    const title = this.add.text(-width / 2 + 30, -10, mode.title, {
      fontSize: '20px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT,
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    const desc = this.add.text(-width / 2 + 30, 14, mode.desc, {
      fontSize: '13px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0, 0.5);

    // Hotkey indicator
    const hotkeyBg = this.add.rectangle(width / 2 - 40, 0, 36, 36, mode.color, 0.3)
      .setStrokeStyle(1, mode.color);
    const hotkeyText = this.add.text(width / 2 - 40, 0, mode.hotkey, {
      fontSize: '18px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    container.add([bg, title, desc, hotkeyBg, hotkeyText]);
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
