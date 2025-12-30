/**
 * Daily Challenge Scene - 10 random words per day
 */

class DailyChallengeScene extends Phaser.Scene {
  constructor() {
    super('DailyChallengeScene');
    this.words = [];
    this.currentIndex = 0;
    this.isFlipped = false;
    this.knownCount = 0;
    this.todayKey = '';
  }

  create() {
    this.todayKey = this.getTodayKey();

    // Check if already completed today
    const completed = localStorage.getItem(`daily_${this.todayKey}`);
    if (completed) {
      this.showAlreadyCompleted();
      return;
    }

    // Get today's random words
    this.words = this.getTodayWords();
    this.currentIndex = 0;
    this.isFlipped = false;
    this.knownCount = 0;

    // Background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.BG_DARK);

    // Header
    this.createHeader();

    // Progress indicator
    this.progressText = this.add.text(GAME_WIDTH / 2, 90, '', {
      fontSize: '14px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0.5);

    // Flashcard
    this.createCard();

    // Control buttons
    this.createControls();

    // Keyboard hint
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 25,
      `${LANG.keyboardHints.space} | ${LANG.keyboardHints.enter} | ${LANG.keyboardHints.backspace}`, {
      fontSize: '11px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0.5);

    // Keyboard controls
    this.setupKeyboard();

    // Show first card
    this.updateCard();
  }

  getTodayKey() {
    const today = new Date();
    return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  }

  getTodayWords() {
    // Use date as seed for consistent daily words
    const seed = this.todayKey.split('-').reduce((a, b) => a + parseInt(b), 0);

    // Get all vocabulary from all sets
    const allSets = getAllVocabSets();
    const allWords = [];
    allSets.forEach(set => {
      set.items.forEach(item => {
        allWords.push({
          ...item,
          setTitle: set.title
        });
      });
    });

    // Shuffle with seeded random
    const shuffled = this.seededShuffle([...allWords], seed);

    // Return first 10 words
    return shuffled.slice(0, 10);
  }

  seededShuffle(array, seed) {
    let m = array.length, t, i;
    while (m) {
      // Use seed for pseudo-random
      seed = (seed * 9301 + 49297) % 233280;
      i = Math.floor((seed / 233280) * m--);
      t = array[m];
      array[m] = array[i];
      array[i] = t;
    }
    return array;
  }

  createHeader() {
    // Back button
    const backBtn = this.add.text(30, 30, LANG.back, {
      fontSize: '16px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

    backBtn.on('pointerdown', () => {
      AudioManager.playEffect('click');
      this.scene.start('MenuScene');
    });

    // Title
    this.add.text(GAME_WIDTH / 2, 40, LANG.dailyChallengeTitle, {
      fontSize: '26px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.STREAK,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Date display
    const today = new Date();
    const dateStr = today.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    this.add.text(GAME_WIDTH / 2, 65, dateStr, {
      fontSize: '13px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0.5);
  }

  createCard() {
    const cardWidth = 600;
    const cardHeight = 300;

    this.cardContainer = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20);

    // Card background
    this.cardBg = this.add.rectangle(0, 0, cardWidth, cardHeight, COLORS.BG_CARD)
      .setStrokeStyle(3, COLORS.STREAK);

    // Word text (front)
    this.wordText = this.add.text(0, -40, '', {
      fontSize: '36px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // IPA text
    this.ipaText = this.add.text(0, 10, '', {
      fontSize: '20px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0.5);

    // Meaning text (back - initially hidden)
    this.meaningText = this.add.text(0, 60, '', {
      fontSize: '24px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.SECONDARY,
      wordWrap: { width: cardWidth - 40 },
      align: 'center',
    }).setOrigin(0.5).setAlpha(0);

    // Part of speech
    this.posText = this.add.text(0, 100, '', {
      fontSize: '14px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0.5).setAlpha(0);

    // Source set
    this.sourceText = this.add.text(0, 130, '', {
      fontSize: '12px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0.5).setAlpha(0);

    // Flip hint
    this.flipHint = this.add.text(0, cardHeight / 2 - 20, LANG.tapToFlip, {
      fontSize: '14px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0.5);

    this.cardContainer.add([
      this.cardBg, this.wordText, this.ipaText,
      this.meaningText, this.posText, this.sourceText, this.flipHint
    ]);

    // Click to flip
    this.cardContainer.setSize(cardWidth, cardHeight);
    this.cardContainer.setInteractive({ useHandCursor: true });
    this.cardContainer.on('pointerdown', () => this.flipCard());
  }

  createControls() {
    const y = GAME_HEIGHT - 90;
    const btnWidth = 180;
    const btnHeight = 50;

    // Know button
    this.knowBtn = this.createButton(
      GAME_WIDTH / 2 - 100, y,
      btnWidth, btnHeight,
      LANG.know,
      COLORS.CORRECT,
      () => this.markAsKnown()
    );
    this.knowBtn.setAlpha(0.5);

    // Learn button
    this.learnBtn = this.createButton(
      GAME_WIDTH / 2 + 100, y,
      btnWidth, btnHeight,
      LANG.learn,
      COLORS.PRIMARY,
      () => this.markAsLearning()
    );
    this.learnBtn.setAlpha(0.5);
  }

  createButton(x, y, width, height, text, color, onClick) {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, width, height, color, 0.2)
      .setStrokeStyle(2, color);

    const label = this.add.text(0, 0, text, {
      fontSize: '16px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    container.add([bg, label]);
    container.setSize(width, height);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => bg.setFillStyle(color, 0.4));
    container.on('pointerout', () => bg.setFillStyle(color, 0.2));
    container.on('pointerdown', () => {
      AudioManager.playEffect('click');
      onClick();
    });

    return container;
  }

  setupKeyboard() {
    // Space to flip
    this.input.keyboard.on('keydown-SPACE', () => this.flipCard());

    // Enter for know
    this.input.keyboard.on('keydown-ENTER', () => {
      if (this.isFlipped) this.markAsKnown();
    });

    // Backspace for learn again
    this.input.keyboard.on('keydown-BACKSPACE', () => {
      if (this.isFlipped) this.markAsLearning();
    });

    // ESC to go back
    this.input.keyboard.on('keydown-ESC', () => {
      AudioManager.playEffect('click');
      this.scene.start('MenuScene');
    });
  }

  updateCard() {
    if (this.currentIndex >= this.words.length) {
      this.showComplete();
      return;
    }

    const word = this.words[this.currentIndex];
    this.isFlipped = false;

    // Update progress
    this.progressText.setText(`${this.currentIndex + 1} / ${this.words.length}`);

    // Update card
    this.wordText.setText(word.word || word.english);
    this.ipaText.setText(word.ipa || '');
    this.meaningText.setText(word.vietnamese || word.meaning || '');
    this.posText.setText(word.pos ? `(${word.pos})` : '');
    this.sourceText.setText(`📚 ${word.setTitle}`);

    // Reset card state
    this.meaningText.setAlpha(0);
    this.posText.setAlpha(0);
    this.sourceText.setAlpha(0);
    this.flipHint.setAlpha(1);
    this.cardBg.setStrokeStyle(3, COLORS.STREAK);
    this.knowBtn.setAlpha(0.5);
    this.learnBtn.setAlpha(0.5);

    // Animate card in
    this.cardContainer.setScale(0.9);
    this.tweens.add({
      targets: this.cardContainer,
      scale: 1,
      duration: 200,
      ease: 'Back.out'
    });

    // Play pronunciation
    AudioManager.speak(word.word || word.english);
  }

  flipCard() {
    if (this.isFlipped) return;
    this.isFlipped = true;

    AudioManager.playEffect('flip');

    // Flip animation
    this.tweens.add({
      targets: this.cardContainer,
      scaleX: 0,
      duration: 100,
      onComplete: () => {
        this.meaningText.setAlpha(1);
        this.posText.setAlpha(1);
        this.sourceText.setAlpha(1);
        this.flipHint.setAlpha(0);
        this.cardBg.setStrokeStyle(3, COLORS.SECONDARY);
        this.knowBtn.setAlpha(1);
        this.learnBtn.setAlpha(1);

        this.tweens.add({
          targets: this.cardContainer,
          scaleX: 1,
          duration: 100
        });
      }
    });
  }

  markAsKnown() {
    if (!this.isFlipped) return;

    AudioManager.playEffect('correct');
    this.knownCount++;

    // Track progress
    const word = this.words[this.currentIndex];
    ProgressTracker.recordAnswer(word.word || word.english, true);

    this.nextCard();
  }

  markAsLearning() {
    if (!this.isFlipped) return;

    AudioManager.playEffect('click');

    // Track for review
    const word = this.words[this.currentIndex];
    ProgressTracker.recordAnswer(word.word || word.english, false);

    this.nextCard();
  }

  nextCard() {
    // Slide out
    this.tweens.add({
      targets: this.cardContainer,
      x: -200,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        this.currentIndex++;
        this.cardContainer.x = GAME_WIDTH / 2 + 200;
        this.updateCard();

        // Slide in
        this.tweens.add({
          targets: this.cardContainer,
          x: GAME_WIDTH / 2,
          alpha: 1,
          duration: 200
        });
      }
    });
  }

  showComplete() {
    // Mark as completed today
    localStorage.setItem(`daily_${this.todayKey}`, JSON.stringify({
      completed: true,
      knownCount: this.knownCount,
      total: this.words.length,
      timestamp: Date.now()
    }));

    // Award points and update streak
    const points = this.knownCount * POINTS.CORRECT_ANSWER + POINTS.COMPLETE_LESSON;
    ProgressTracker.addPoints(points);
    ProgressTracker.updateStreak();

    // Clear current content
    this.cardContainer.destroy();
    this.knowBtn.destroy();
    this.learnBtn.destroy();
    this.progressText.destroy();

    // Show complete screen
    const accuracy = Math.round((this.knownCount / this.words.length) * 100);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100, LANG.complete, {
      fontSize: '48px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.GOLD,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30,
      `${LANG.accuracy}: ${accuracy}%`, {
      fontSize: '24px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10,
      `✓ ${this.knownCount} / ${this.words.length} ${LANG.words}`, {
      fontSize: '20px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.CORRECT,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50,
      `+${points} ${LANG.points}`, {
      fontSize: '28px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.GOLD,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Back button
    const backBtn = this.createButton(
      GAME_WIDTH / 2, GAME_HEIGHT / 2 + 130,
      200, 50,
      LANG.back,
      COLORS.PRIMARY,
      () => this.scene.start('MenuScene')
    );
  }

  showAlreadyCompleted() {
    // Background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.BG_DARK);

    // Header
    this.createHeader();

    // Already completed message
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, '✅ ' + LANG.alreadyCompleted, {
      fontSize: '24px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.CORRECT,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10, LANG.comeBackTomorrow, {
      fontSize: '18px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0.5);

    // Show today's result
    const todayData = JSON.parse(localStorage.getItem(`daily_${this.todayKey}`) || '{}');
    if (todayData.knownCount !== undefined) {
      const accuracy = Math.round((todayData.knownCount / todayData.total) * 100);
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60,
        `Kết quả hôm nay: ${todayData.knownCount}/${todayData.total} (${accuracy}%)`, {
        fontSize: '16px',
        fontFamily: 'Segoe UI, system-ui',
        color: COLOR_STRINGS.TEXT_MUTED,
      }).setOrigin(0.5);
    }

    // Back button
    const backBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 130, LANG.back, {
      fontSize: '18px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.PRIMARY,
      fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    backBtn.on('pointerdown', () => {
      AudioManager.playEffect('click');
      this.scene.start('MenuScene');
    });

    // ESC to go back
    this.input.keyboard.on('keydown-ESC', () => {
      AudioManager.playEffect('click');
      this.scene.start('MenuScene');
    });
  }
}
