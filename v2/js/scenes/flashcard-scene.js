/**
 * Flashcard Scene - Learn vocabulary with interactive flashcards (Vietnamese)
 */

class FlashcardScene extends Phaser.Scene {
  constructor() {
    super('FlashcardScene');
    this.currentIndex = 0;
    this.currentSide = 'front';
    this.isFlipping = false;
    this.score = 0;
    this.words = [];
  }

  create() {
    const vocabSet = getCurrentVocabSet();
    this.words = [...vocabSet.items];
    this.currentIndex = 0;
    this.score = 0;

    // Top bar
    this.createTopBar();

    // Instructions
    this.add.text(GAME_WIDTH / 2, 90, LANG.tapToFlip, {
      fontSize: '14px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0.5);

    // Progress bar
    this.createProgressBar();

    // Create buttons
    this.createActionButtons();

    // Keyboard hints
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 60,
      `${LANG.keyboardHints.space} | ${LANG.keyboardHints.enter} | ${LANG.keyboardHints.backspace}`, {
      fontSize: '11px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0.5);

    // Setup keyboard controls
    this.setupKeyboard();

    // Show first card
    this.showCard();
  }

  setupKeyboard() {
    // Space to flip
    this.input.keyboard.on('keydown-SPACE', () => this.flipCard());

    // Enter for know
    this.input.keyboard.on('keydown-ENTER', () => this.handleKnow());

    // Backspace for learn
    this.input.keyboard.on('keydown-BACKSPACE', () => this.handleLearn());

    // Left/Right arrows for navigation (optional)
    this.input.keyboard.on('keydown-RIGHT', () => this.handleKnow());
    this.input.keyboard.on('keydown-LEFT', () => this.handleLearn());

    // P to play pronunciation
    this.input.keyboard.on('keydown-P', () => {
      const word = this.words[this.currentIndex];
      if (word) AudioManager.playWord(word.word);
    });

    // ESC to go back
    this.input.keyboard.on('keydown-ESC', () => {
      AudioManager.playEffect('click');
      this.scene.start('MenuScene');
    });
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
      this.scene.start('MenuScene');
    });

    // Title
    this.add.text(GAME_WIDTH / 2, 30, LANG.modes.flashcard.title, {
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

  createProgressBar() {
    const y = GAME_HEIGHT - 30;
    const barWidth = GAME_WIDTH - 100;

    this.add.rectangle(GAME_WIDTH / 2, y, barWidth, 16, COLORS.BG_CARD)
      .setStrokeStyle(2, COLORS.SECONDARY);

    this.progressBar = this.add.rectangle(50, y, 0, 12, COLORS.PRIMARY)
      .setOrigin(0, 0.5);

    this.progressText = this.add.text(GAME_WIDTH / 2, y, `1/${this.words.length}`, {
      fontSize: '12px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT,
    }).setOrigin(0.5);
  }

  updateProgressBar() {
    const progress = (this.currentIndex + 1) / this.words.length;
    this.progressBar.width = (GAME_WIDTH - 100) * progress;
    this.progressText.setText(`${this.currentIndex + 1}/${this.words.length}`);
  }

  createActionButtons() {
    const y = GAME_HEIGHT - 100;

    // Know button (Enter)
    this.createButton(GAME_WIDTH / 2 - 150, y, LANG.know, COLORS.CORRECT, () => {
      this.handleKnow();
    });

    // Flip button (Space)
    this.createButton(GAME_WIDTH / 2, y, LANG.flip, COLORS.SECONDARY, () => {
      this.flipCard();
    });

    // Learn button (Backspace)
    this.createButton(GAME_WIDTH / 2 + 150, y, LANG.learn, COLORS.WARNING, () => {
      this.handleLearn();
    });
  }

  createButton(x, y, text, color, onClick) {
    const container = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 130, 45, color).setStrokeStyle(2, 0xffffff, 0.2);
    const label = this.add.text(0, 0, text, {
      fontSize: '16px',
      fontFamily: 'Segoe UI, system-ui',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    container.add([bg, label]);
    container.setSize(130, 45);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerdown', () => {
      AudioManager.playEffect('click');
      onClick();
    });

    return container;
  }

  showCard() {
    if (this.currentIndex >= this.words.length) {
      this.completeGame();
      return;
    }

    const word = this.words[this.currentIndex];
    this.currentSide = 'front';

    // Clear previous card
    if (this.card) {
      this.card.destroy();
    }

    // Create card
    this.card = this.add.container(GAME_WIDTH / 2, 300);

    // Card background
    this.cardBg = this.add.rectangle(0, 0, 420, 280, COLORS.BG_CARD)
      .setStrokeStyle(4, COLORS.PRIMARY);
    this.card.add(this.cardBg);

    // Front side content
    this.frontContent = this.add.container(0, 0);

    const wordText = this.add.text(0, -40, word.word, {
      fontSize: '32px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const posText = this.add.text(0, 10, `(${word.pos})`, {
      fontSize: '16px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0.5);

    const ipaText = this.add.text(0, 45, word.ipa || '', {
      fontSize: '20px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.SECONDARY,
    }).setOrigin(0.5);

    // Audio button
    const audioBtn = this.add.container(160, -40);
    const audioBg = this.add.circle(0, 0, 25, COLORS.PRIMARY);
    const audioIcon = this.add.text(0, 0, '🔊', { fontSize: '18px' }).setOrigin(0.5);
    audioBtn.add([audioBg, audioIcon]);
    audioBtn.setSize(50, 50);
    audioBtn.setInteractive({ useHandCursor: true });
    audioBtn.on('pointerdown', (p) => {
      p.stopPropagation();
      AudioManager.playWord(word.word);
    });

    const tapHint = this.add.text(0, 100, LANG.tapToFlip, {
      fontSize: '14px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0.5);

    this.frontContent.add([wordText, posText, ipaText, audioBtn, tapHint]);
    this.card.add(this.frontContent);

    // Back side content (hidden initially)
    this.backContent = this.add.container(0, 0);
    this.backContent.setVisible(false);

    const meaningText = this.add.text(0, -20, word.meaning, {
      fontSize: '28px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.SECONDARY,
      fontStyle: 'bold',
      wordWrap: { width: 360 },
      align: 'center',
    }).setOrigin(0.5);

    const wordBack = this.add.text(0, 50, word.word, {
      fontSize: '18px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0.5);

    this.backContent.add([meaningText, wordBack]);
    this.card.add(this.backContent);

    // Make card interactive
    this.card.setSize(420, 280);
    this.card.setInteractive({ useHandCursor: true });
    this.card.on('pointerdown', () => this.flipCard());

    // Animate in
    this.card.setAlpha(0);
    this.card.setScale(0.8);
    this.tweens.add({
      targets: this.card,
      alpha: 1,
      scale: 1,
      duration: 300,
      ease: 'Back.easeOut',
    });

    // Auto-play pronunciation
    this.time.delayedCall(300, () => {
      AudioManager.playWord(word.word);
    });

    this.updateProgressBar();
  }

  flipCard() {
    if (this.isFlipping) return;
    this.isFlipping = true;

    AudioManager.playEffect('click');

    this.tweens.add({
      targets: this.card,
      scaleX: 0,
      duration: 150,
      ease: 'Power2',
      onComplete: () => {
        if (this.currentSide === 'front') {
          this.frontContent.setVisible(false);
          this.backContent.setVisible(true);
          this.cardBg.setStrokeStyle(4, COLORS.SECONDARY);
          this.currentSide = 'back';
        } else {
          this.frontContent.setVisible(true);
          this.backContent.setVisible(false);
          this.cardBg.setStrokeStyle(4, COLORS.PRIMARY);
          this.currentSide = 'front';
        }

        this.tweens.add({
          targets: this.card,
          scaleX: 1,
          duration: 150,
          ease: 'Power2',
          onComplete: () => {
            this.isFlipping = false;
          },
        });
      },
    });
  }

  handleKnow() {
    const word = this.words[this.currentIndex];
    ProgressTracker.recordAnswer(word.id || word.word, true);
    this.score += POINTS.CORRECT_FIRST_TRY;
    this.scoreText.setText(`⭐ ${this.score}`);
    AudioManager.playEffect('correct');
    this.nextCard();
  }

  handleLearn() {
    const word = this.words[this.currentIndex];
    ProgressTracker.recordAnswer(word.id || word.word, false);
    this.nextCard();
  }

  nextCard() {
    this.tweens.add({
      targets: this.card,
      x: GAME_WIDTH + 300,
      alpha: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        this.currentIndex++;
        this.showCard();
      },
    });
  }

  completeGame() {
    ProgressTracker.addPoints(this.score);
    AudioManager.playEffect('complete');

    // Show completion screen
    const overlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.8);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, LANG.complete, {
      fontSize: '36px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, `${LANG.score}: ${this.score}`, {
      fontSize: '24px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.GOLD,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40, `${LANG.wordsStudied}: ${this.words.length}`, {
      fontSize: '18px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0.5);

    this.createButton(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 120, LANG.continue, COLORS.PRIMARY, () => {
      this.scene.start('MenuScene');
    });
  }
}
