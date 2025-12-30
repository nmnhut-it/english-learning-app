/**
 * Word Blitz Scene - Timed matching game (Vietnamese)
 */

class WordBlitzScene extends Phaser.Scene {
  constructor() {
    super('WordBlitzScene');
    this.score = 0;
    this.timeLeft = 60;
    this.words = [];
    this.currentWord = null;
    this.streak = 0;
    this.maxStreak = 0;
  }

  create() {
    const vocabSet = getCurrentVocabSet();
    this.words = this.shuffleArray([...vocabSet.items]);
    this.wordIndex = 0;
    this.score = 0;
    this.timeLeft = 60;
    this.streak = 0;
    this.maxStreak = 0;
    this.isGameOver = false;

    // Top bar
    this.createTopBar();

    // Timer bar
    this.createTimerBar();

    // Keyboard hints
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 20,
      '1-4: Chọn đáp án | ESC: Quay lại', {
      fontSize: '11px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0.5);

    // Setup keyboard
    this.setupKeyboard();

    // Start countdown
    this.timer = this.time.addEvent({
      delay: 1000,
      callback: this.updateTimer,
      callbackScope: this,
      loop: true,
    });

    // Show first word
    this.showWord();
  }

  setupKeyboard() {
    // 1-4 for options
    ['ONE', 'TWO', 'THREE', 'FOUR'].forEach((key, i) => {
      this.input.keyboard.on(`keydown-${key}`, () => this.selectOptionByIndex(i));
    });

    // ESC to go back
    this.input.keyboard.on('keydown-ESC', () => {
      AudioManager.playEffect('click');
      if (this.timer) this.timer.remove();
      this.scene.start('MenuScene');
    });
  }

  selectOptionByIndex(index) {
    if (this.optionButtons && this.optionButtons[index] && !this.isGameOver) {
      const btn = this.optionButtons[index];
      this.handleAnswer(btn.isCorrect, btn, btn.optionBg);
    }
  }

  createTopBar() {
    this.add.rectangle(GAME_WIDTH / 2, 30, GAME_WIDTH, 60, COLORS.BG_CARD);

    // Back button
    const backBtn = this.add.text(30, 30, LANG.back, {
      fontSize: '16px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT,
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

    backBtn.on('pointerdown', () => {
      AudioManager.playEffect('click');
      if (this.timer) this.timer.remove();
      this.scene.start('MenuScene');
    });

    // Title
    this.add.text(GAME_WIDTH / 2, 30, LANG.modes.wordBlitz.title, {
      fontSize: '20px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Score
    this.scoreText = this.add.text(GAME_WIDTH - 30, 30, `⭐ ${this.score}`, {
      fontSize: '16px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.GOLD,
    }).setOrigin(1, 0.5);
  }

  createTimerBar() {
    const y = 80;
    const barWidth = GAME_WIDTH - 60;

    this.add.rectangle(GAME_WIDTH / 2, y, barWidth, 20, COLORS.BG_CARD)
      .setStrokeStyle(2, COLORS.WARNING);

    this.timerBar = this.add.rectangle(30, y, barWidth, 16, COLORS.WARNING)
      .setOrigin(0, 0.5);

    this.timerText = this.add.text(GAME_WIDTH / 2, y, `⏱️ ${this.timeLeft}s`, {
      fontSize: '12px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT,
    }).setOrigin(0.5);

    // Streak indicator
    this.streakText = this.add.text(GAME_WIDTH - 30, y + 30, '', {
      fontSize: '16px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.GOLD,
    }).setOrigin(1, 0.5);
  }

  updateTimer() {
    if (this.isGameOver) return;

    this.timeLeft--;
    this.timerText.setText(`⏱️ ${this.timeLeft}s`);
    this.timerBar.width = (GAME_WIDTH - 60) * (this.timeLeft / 60);

    // Change color as time runs out
    if (this.timeLeft <= 10) {
      this.timerBar.setFillStyle(COLORS.INCORRECT);
    } else if (this.timeLeft <= 20) {
      this.timerBar.setFillStyle(0xf59e0b); // Orange
    }

    if (this.timeLeft <= 0) {
      this.timer.remove();
      this.completeGame();
    }
  }

  showWord() {
    if (this.isGameOver) return;

    // Clear previous
    if (this.wordContainer) {
      this.wordContainer.destroy();
    }

    // Check if we need to cycle words
    if (this.wordIndex >= this.words.length) {
      this.words = this.shuffleArray(this.words);
      this.wordIndex = 0;
    }

    this.currentWord = this.words[this.wordIndex];
    this.wordContainer = this.add.container(0, 0);

    // Word display
    const wordBg = this.add.rectangle(GAME_WIDTH / 2, 180, 400, 80, COLORS.BG_CARD)
      .setStrokeStyle(3, COLORS.PRIMARY);

    const wordText = this.add.text(GAME_WIDTH / 2, 170, this.currentWord.word, {
      fontSize: '32px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const ipaText = this.add.text(GAME_WIDTH / 2, 200, this.currentWord.ipa || '', {
      fontSize: '16px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.SECONDARY,
    }).setOrigin(0.5);

    this.wordContainer.add([wordBg, wordText, ipaText]);

    // Generate options
    const options = this.generateOptions(this.currentWord);

    // Option buttons
    this.optionButtons = [];
    options.forEach((option, i) => {
      const y = 280 + i * 70;
      const btn = this.createOptionButton(GAME_WIDTH / 2, y, option, option === this.currentWord.meaning, i);
      this.optionButtons.push(btn);
      this.wordContainer.add(btn);
    });

    // Play pronunciation
    AudioManager.playWord(this.currentWord.word);
  }

  createOptionButton(x, y, meaning, isCorrect, index) {
    const container = this.add.container(x, y);
    const width = 500;
    const height = 55;

    const bg = this.add.rectangle(0, 0, width, height, COLORS.BG_CARD)
      .setStrokeStyle(2, COLORS.SECONDARY);

    // Hotkey indicator
    const hotkeyBg = this.add.rectangle(-width/2 + 25, 0, 30, 30, COLORS.SECONDARY, 0.3);
    const hotkeyText = this.add.text(-width/2 + 25, 0, String(index + 1), {
      fontSize: '14px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const text = this.add.text(15, 0, meaning, {
      fontSize: '15px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT,
      wordWrap: { width: width - 80 },
      align: 'center',
    }).setOrigin(0.5);

    container.add([bg, hotkeyBg, hotkeyText, text]);
    container.setSize(width, height);
    container.setInteractive({ useHandCursor: true });

    // Store references for keyboard selection
    container.isCorrect = isCorrect;
    container.optionBg = bg;

    container.on('pointerover', () => {
      bg.setFillStyle(COLORS.BG_LIGHT);
    });

    container.on('pointerout', () => {
      bg.setFillStyle(COLORS.BG_CARD);
    });

    container.on('pointerdown', () => {
      this.handleAnswer(isCorrect, container, bg);
    });

    return container;
  }

  handleAnswer(isCorrect, container, bg) {
    if (this.isGameOver) return;

    if (isCorrect) {
      // Correct answer
      AudioManager.playEffect('correct');
      this.streak++;
      if (this.streak > this.maxStreak) this.maxStreak = this.streak;

      // Score with streak bonus
      let points = POINTS.CORRECT_FIRST_TRY;
      if (this.streak >= 5) {
        points += POINTS.STREAK_BONUS;
        AudioManager.playEffect('streak');
      }
      this.score += points;
      this.scoreText.setText(`⭐ ${this.score}`);

      // Update streak display
      if (this.streak >= 3) {
        this.streakText.setText(`🔥 ${this.streak} streak!`);
      }

      // Bonus time for correct answer
      this.timeLeft = Math.min(60, this.timeLeft + 2);
      this.timerText.setText(`⏱️ ${this.timeLeft}s`);

      bg.setFillStyle(COLORS.CORRECT);

      // Record progress
      ProgressTracker.recordAnswer(this.currentWord.id || this.currentWord.word, true);

      // Next word
      this.time.delayedCall(200, () => {
        this.wordIndex++;
        this.showWord();
      });
    } else {
      // Wrong answer
      AudioManager.playEffect('incorrect');
      this.streak = 0;
      this.streakText.setText('');

      // Time penalty
      this.timeLeft = Math.max(0, this.timeLeft - 3);
      this.timerText.setText(`⏱️ ${this.timeLeft}s`);

      bg.setFillStyle(COLORS.INCORRECT);

      // Record progress
      ProgressTracker.recordAnswer(this.currentWord.id || this.currentWord.word, false);

      // Brief flash then continue
      this.time.delayedCall(300, () => {
        bg.setFillStyle(COLORS.BG_CARD);
      });
    }
  }

  generateOptions(correctWord) {
    const options = [correctWord.meaning];
    const otherWords = this.words.filter(w => w.word !== correctWord.word);

    // Add 3 random wrong options
    const shuffled = this.shuffleArray(otherWords);
    for (let i = 0; i < 3 && i < shuffled.length; i++) {
      options.push(shuffled[i].meaning);
    }

    return this.shuffleArray(options);
  }

  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  completeGame() {
    if (this.isGameOver) return;
    this.isGameOver = true;

    if (this.timer) this.timer.remove();
    ProgressTracker.addPoints(this.score);
    AudioManager.playEffect('complete');

    const overlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.8);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100, '⚡ Hết giờ!', {
      fontSize: '36px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30, `${LANG.score}: ${this.score}`, {
      fontSize: '28px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.GOLD,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, `Số từ đã trả lời: ${this.wordIndex}`, {
      fontSize: '18px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, `Chuỗi dài nhất: 🔥 ${this.maxStreak}`, {
      fontSize: '18px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.SECONDARY,
    }).setOrigin(0.5);

    // Continue button
    const btn = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 130);
    const btnBg = this.add.rectangle(0, 0, 150, 50, COLORS.PRIMARY).setStrokeStyle(2, 0xffffff, 0.2);
    const btnText = this.add.text(0, 0, LANG.continue, {
      fontSize: '18px',
      fontFamily: 'Segoe UI, system-ui',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    btn.add([btnBg, btnText]);
    btn.setSize(150, 50);
    btn.setInteractive({ useHandCursor: true });
    btn.on('pointerdown', () => {
      AudioManager.playEffect('click');
      this.scene.start('MenuScene');
    });
  }
}
