/**
 * Pronunciation Scene - Listen and select the correct word
 */

class PronunciationScene extends Phaser.Scene {
  constructor() {
    super('PronunciationScene');
    this.score = 0;
    this.lives = 3;
    this.currentIndex = 0;
    this.words = [];
    this.options = [];
  }

  create() {
    const vocabSet = getCurrentVocabSet();
    this.words = this.shuffleArray([...vocabSet.items]).slice(0, 15);
    this.currentIndex = 0;
    this.score = 0;
    this.lives = 3;

    // Top bar
    this.createTopBar();

    // Instructions
    this.add.text(GAME_WIDTH / 2, 85, 'Listen and select the correct word!', {
      fontSize: '14px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0.5);

    // Show first question
    this.showQuestion();
  }

  createTopBar() {
    this.add.rectangle(GAME_WIDTH / 2, 30, GAME_WIDTH, 60, COLORS.BG_CARD);

    // Back button
    const backBtn = this.add.text(30, 30, '← Back', {
      fontSize: '16px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT,
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

    backBtn.on('pointerdown', () => {
      AudioManager.playEffect('click');
      this.scene.start('MenuScene');
    });

    // Title
    this.add.text(GAME_WIDTH / 2, 30, '🔊 Listen & Select', {
      fontSize: '20px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Score and lives
    this.scoreText = this.add.text(GAME_WIDTH - 120, 30, `⭐ ${this.score}`, {
      fontSize: '16px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.GOLD,
    }).setOrigin(1, 0.5);

    this.livesText = this.add.text(GAME_WIDTH - 30, 30, `❤️ ${this.lives}`, {
      fontSize: '16px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.INCORRECT,
    }).setOrigin(1, 0.5);
  }

  showQuestion() {
    // Clear previous
    if (this.questionContainer) {
      this.questionContainer.destroy();
    }

    if (this.currentIndex >= this.words.length || this.lives <= 0) {
      this.completeGame();
      return;
    }

    this.questionContainer = this.add.container(0, 0);
    this.hasAnswered = false;

    const currentWord = this.words[this.currentIndex];

    // Generate options (1 correct + 3 wrong)
    this.options = this.generateOptions(currentWord);

    // Audio play button
    const audioBtn = this.add.container(GAME_WIDTH / 2, 200);
    const audioBg = this.add.circle(0, 0, 60, COLORS.PRIMARY);
    const audioIcon = this.add.text(0, 0, '🔊', { fontSize: '40px' }).setOrigin(0.5);
    audioBtn.add([audioBg, audioIcon]);
    audioBtn.setSize(120, 120);
    audioBtn.setInteractive({ useHandCursor: true });

    audioBtn.on('pointerdown', () => {
      AudioManager.playWord(currentWord.word);
      // Pulse animation
      this.tweens.add({
        targets: audioBtn,
        scale: 1.1,
        duration: 100,
        yoyo: true,
      });
    });

    this.questionContainer.add(audioBtn);

    // Hint text
    const hintText = this.add.text(GAME_WIDTH / 2, 290, 'Tap to hear the word', {
      fontSize: '14px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0.5);
    this.questionContainer.add(hintText);

    // IPA hint (optional - shows after first play)
    if (currentWord.ipa) {
      const ipaHint = this.add.text(GAME_WIDTH / 2, 320, currentWord.ipa, {
        fontSize: '16px',
        fontFamily: 'Segoe UI, system-ui',
        color: COLOR_STRINGS.SECONDARY,
      }).setOrigin(0.5).setAlpha(0);
      this.questionContainer.add(ipaHint);

      // Show IPA after first play
      audioBtn.on('pointerdown', () => {
        this.tweens.add({
          targets: ipaHint,
          alpha: 1,
          duration: 300,
        });
      });
    }

    // Option buttons
    this.optionButtons = [];
    this.options.forEach((option, i) => {
      const row = Math.floor(i / 2);
      const col = i % 2;
      const x = GAME_WIDTH / 2 - 150 + col * 300;
      const y = 400 + row * 80;

      const btn = this.createOptionButton(x, y, option, option.word === currentWord.word);
      this.optionButtons.push(btn);
      this.questionContainer.add(btn);
    });

    // Progress
    const progressText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 30,
      `${this.currentIndex + 1}/${this.words.length}`, {
      fontSize: '14px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0.5);
    this.questionContainer.add(progressText);

    // Auto-play pronunciation
    this.time.delayedCall(500, () => {
      AudioManager.playWord(currentWord.word);
    });
  }

  createOptionButton(x, y, option, isCorrect) {
    const container = this.add.container(x, y);
    const width = 280;
    const height = 60;

    const bg = this.add.rectangle(0, 0, width, height, COLORS.BG_CARD)
      .setStrokeStyle(2, COLORS.SECONDARY);

    const text = this.add.text(0, 0, option.word, {
      fontSize: '20px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    container.add([bg, text]);
    container.setSize(width, height);
    container.setInteractive({ useHandCursor: true });

    container.isCorrect = isCorrect;
    container.optionBg = bg;

    container.on('pointerover', () => {
      if (!this.hasAnswered) {
        bg.setFillStyle(COLORS.BG_LIGHT);
      }
    });

    container.on('pointerout', () => {
      if (!this.hasAnswered) {
        bg.setFillStyle(COLORS.BG_CARD);
      }
    });

    container.on('pointerdown', () => {
      if (!this.hasAnswered) {
        this.handleAnswer(container);
      }
    });

    return container;
  }

  handleAnswer(selectedButton) {
    this.hasAnswered = true;
    const currentWord = this.words[this.currentIndex];

    // Disable all buttons
    this.optionButtons.forEach(btn => {
      btn.disableInteractive();
    });

    if (selectedButton.isCorrect) {
      // Correct
      AudioManager.playEffect('correct');
      this.score += POINTS.CORRECT_FIRST_TRY;
      this.scoreText.setText(`⭐ ${this.score}`);
      selectedButton.optionBg.setFillStyle(COLORS.CORRECT);
      selectedButton.optionBg.setStrokeStyle(3, COLORS.CORRECT);

      ProgressTracker.recordAnswer(currentWord.id || currentWord.word, true);

      // Next question
      this.time.delayedCall(800, () => {
        this.currentIndex++;
        this.showQuestion();
      });
    } else {
      // Wrong
      AudioManager.playEffect('incorrect');
      this.lives--;
      this.livesText.setText(`❤️ ${this.lives}`);
      selectedButton.optionBg.setFillStyle(COLORS.INCORRECT);
      selectedButton.optionBg.setStrokeStyle(3, COLORS.INCORRECT);

      // Show correct answer
      this.optionButtons.forEach(btn => {
        if (btn.isCorrect) {
          btn.optionBg.setFillStyle(COLORS.CORRECT);
          btn.optionBg.setStrokeStyle(3, COLORS.CORRECT);
        }
      });

      ProgressTracker.recordAnswer(currentWord.id || currentWord.word, false);

      // Play correct pronunciation
      this.time.delayedCall(500, () => {
        AudioManager.playWord(currentWord.word);
      });

      // Next question or game over
      this.time.delayedCall(1500, () => {
        this.currentIndex++;
        this.showQuestion();
      });
    }
  }

  generateOptions(correctWord) {
    const options = [correctWord];
    const otherWords = this.words.filter(w => w.word !== correctWord.word);

    // Add 3 random wrong options
    const shuffled = this.shuffleArray(otherWords);
    for (let i = 0; i < 3 && i < shuffled.length; i++) {
      options.push(shuffled[i]);
    }

    // Shuffle options
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
    ProgressTracker.addPoints(this.score);
    AudioManager.playEffect('complete');

    const overlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.8);

    const isWin = this.lives > 0;
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, isWin ? '🎉 Complete!' : '💔 Game Over', {
      fontSize: '36px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, `Score: ${this.score}`, {
      fontSize: '24px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.GOLD,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40, `Words identified: ${this.currentIndex}/${this.words.length}`, {
      fontSize: '18px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0.5);

    // Continue button
    const btn = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 120);
    const btnBg = this.add.rectangle(0, 0, 150, 50, COLORS.PRIMARY).setStrokeStyle(2, 0xffffff, 0.2);
    const btnText = this.add.text(0, 0, 'Continue', {
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
