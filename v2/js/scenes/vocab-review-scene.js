/**
 * Vocabulary Review Scene - Practice difficult words
 */

class VocabReviewScene extends Phaser.Scene {
  constructor() {
    super('VocabReviewScene');
    this.reviewWords = [];
    this.currentIndex = 0;
    this.correctCount = 0;
    this.wrongCount = 0;
    this.classId = '';
  }

  create() {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.BG_DARK);

    // Get review data
    const reviewData = window.reviewData;
    if (!reviewData || !reviewData.words || reviewData.words.length === 0) {
      this.showNoWordsMessage();
      return;
    }

    this.classId = reviewData.classId;
    this.reviewWords = reviewData.words;
    this.currentIndex = 0;
    this.correctCount = 0;
    this.wrongCount = 0;

    // Find full vocabulary data for these words
    this.vocabData = this.getVocabData();

    // Title
    this.add.text(GAME_WIDTH / 2, 30, `🔄 Ôn Tập Từ Khó - ${this.classId}`, {
      fontSize: '22px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.WARNING,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Progress
    this.progressText = this.add.text(GAME_WIDTH / 2, 60, '', {
      fontSize: '14px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0.5);

    // Back button
    const backBtn = this.add.text(30, 30, LANG.back, {
      fontSize: '16px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

    backBtn.on('pointerdown', () => {
      AudioManager.playEffect('click');
      this.scene.start('TeacherDashboardScene');
    });

    this.showQuestion();
  }

  getVocabData() {
    // Get vocabulary data from all sets
    const allSets = getAllVocabSets();
    const vocabMap = {};

    allSets.forEach(set => {
      set.items.forEach(item => {
        vocabMap[item.word.toLowerCase()] = item;
      });
    });

    // Map review words to full vocab data
    return this.reviewWords.map(word => {
      const found = vocabMap[word.toLowerCase()];
      if (found) {
        return found;
      }
      // If not found, create minimal data
      return { word, meaning: '', ipa: '' };
    }).filter(v => v.meaning); // Only keep words with meanings
  }

  showNoWordsMessage() {
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '✅ Không có từ cần ôn tập!', {
      fontSize: '20px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.CORRECT,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40, 'Nhấn ESC để quay lại', {
      fontSize: '14px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0.5);

    this.input.keyboard.on('keydown-ESC', () => {
      this.scene.start('TeacherDashboardScene');
    });
  }

  showQuestion() {
    // Clear previous question
    if (this.questionContainer) {
      this.questionContainer.destroy();
    }

    if (this.currentIndex >= this.vocabData.length) {
      this.showResults();
      return;
    }

    const word = this.vocabData[this.currentIndex];
    this.currentWord = word;
    this.hasAnswered = false;

    // Update progress
    this.progressText.setText(`Câu ${this.currentIndex + 1}/${this.vocabData.length} | ✓ ${this.correctCount} | ✗ ${this.wrongCount}`);

    this.questionContainer = this.add.container(0, 0);

    // Word display
    const wordBg = this.add.rectangle(GAME_WIDTH / 2, 180, 500, 100, COLORS.BG_CARD)
      .setStrokeStyle(3, COLORS.WARNING);

    const wordText = this.add.text(GAME_WIDTH / 2, 165, word.word, {
      fontSize: '32px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const ipaText = this.add.text(GAME_WIDTH / 2, 205, word.ipa || '', {
      fontSize: '18px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.SECONDARY,
    }).setOrigin(0.5);

    this.questionContainer.add([wordBg, wordText, ipaText]);

    // Play pronunciation
    AudioManager.playWord(word.word);

    // Generate options
    const options = this.generateOptions(word);
    this.optionButtons = [];

    options.forEach((opt, i) => {
      const y = 280 + i * 55;
      const isCorrect = opt === word.meaning;
      const btn = this.createOptionButton(GAME_WIDTH / 2, y, opt, isCorrect, i);
      this.optionButtons.push(btn);
      this.questionContainer.add(btn);
    });

    // Keyboard hints
    const hints = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 30, '1-4: Chọn đáp án | SPACE: Nghe lại | ESC: Thoát', {
      fontSize: '12px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0.5);
    this.questionContainer.add(hints);

    // Setup keyboard
    this.setupKeyboard();
  }

  generateOptions(correctWord) {
    const options = [correctWord.meaning];
    const others = this.vocabData.filter(w => w.word !== correctWord.word);
    const shuffled = this.shuffleArray(others);

    for (let i = 0; i < 3 && i < shuffled.length; i++) {
      options.push(shuffled[i].meaning);
    }

    // If not enough options, get from all vocab
    if (options.length < 4) {
      const allSets = getAllVocabSets();
      allSets.forEach(set => {
        set.items.forEach(item => {
          if (options.length < 4 && !options.includes(item.meaning)) {
            options.push(item.meaning);
          }
        });
      });
    }

    return this.shuffleArray(options);
  }

  createOptionButton(x, y, meaning, isCorrect, index) {
    const container = this.add.container(x, y);
    const width = 550;
    const height = 48;

    const bg = this.add.rectangle(0, 0, width, height, COLORS.BG_CARD)
      .setStrokeStyle(2, COLORS.SECONDARY);

    const hotkeyBg = this.add.rectangle(-width / 2 + 25, 0, 32, 32, COLORS.SECONDARY, 0.3);
    const hotkeyText = this.add.text(-width / 2 + 25, 0, String(index + 1), {
      fontSize: '16px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const text = this.add.text(20, 0, meaning, {
      fontSize: '16px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT,
      wordWrap: { width: width - 80 },
    }).setOrigin(0.5);

    container.add([bg, hotkeyBg, hotkeyText, text]);
    container.setSize(width, height);
    container.setInteractive({ useHandCursor: true });

    container.isCorrect = isCorrect;
    container.optionBg = bg;

    container.on('pointerover', () => {
      if (!this.hasAnswered) bg.setFillStyle(COLORS.BG_LIGHT);
    });
    container.on('pointerout', () => {
      if (!this.hasAnswered) bg.setFillStyle(COLORS.BG_CARD);
    });
    container.on('pointerdown', () => {
      if (!this.hasAnswered) this.handleAnswer(container);
    });

    return container;
  }

  setupKeyboard() {
    this.input.keyboard.removeAllListeners();

    ['ONE', 'TWO', 'THREE', 'FOUR'].forEach((key, i) => {
      this.input.keyboard.on(`keydown-${key}`, () => {
        if (!this.hasAnswered && this.optionButtons[i]) {
          this.handleAnswer(this.optionButtons[i]);
        }
      });
    });

    this.input.keyboard.on('keydown-SPACE', () => {
      AudioManager.playWord(this.currentWord.word);
    });

    this.input.keyboard.on('keydown-ESC', () => {
      this.scene.start('TeacherDashboardScene');
    });
  }

  handleAnswer(button) {
    this.hasAnswered = true;

    this.optionButtons.forEach(btn => btn.disableInteractive());

    if (button.isCorrect) {
      AudioManager.playEffect('correct');
      button.optionBg.setFillStyle(COLORS.CORRECT);
      button.optionBg.setStrokeStyle(3, COLORS.CORRECT);
      this.correctCount++;
    } else {
      AudioManager.playEffect('incorrect');
      button.optionBg.setFillStyle(COLORS.INCORRECT);

      this.optionButtons.forEach(btn => {
        if (btn.isCorrect) {
          btn.optionBg.setFillStyle(COLORS.CORRECT);
          btn.optionBg.setStrokeStyle(3, COLORS.CORRECT);
        }
      });
      this.wrongCount++;
    }

    this.time.delayedCall(1500, () => {
      this.currentIndex++;
      this.showQuestion();
    });
  }

  showResults() {
    this.children.removeAll();

    AudioManager.playEffect('complete');

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.BG_DARK);

    this.add.text(GAME_WIDTH / 2, 100, '🎉 Hoàn Thành Ôn Tập!', {
      fontSize: '28px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.GOLD,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const total = this.correctCount + this.wrongCount;
    const accuracy = total > 0 ? Math.round(this.correctCount / total * 100) : 0;

    this.add.text(GAME_WIDTH / 2, 180, `✓ Đúng: ${this.correctCount}`, {
      fontSize: '24px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.CORRECT,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 220, `✗ Sai: ${this.wrongCount}`, {
      fontSize: '24px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.INCORRECT,
    }).setOrigin(0.5);

    const accuracyColor = accuracy >= 80 ? COLOR_STRINGS.CORRECT :
                          accuracy >= 50 ? COLOR_STRINGS.WARNING :
                          COLOR_STRINGS.INCORRECT;

    this.add.text(GAME_WIDTH / 2, 280, `Độ chính xác: ${accuracy}%`, {
      fontSize: '28px',
      fontFamily: 'Segoe UI, system-ui',
      color: accuracyColor,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Buttons
    this.createResultButton(GAME_WIDTH / 2 - 120, 380, '🔄 Ôn lại', COLORS.WARNING, () => {
      this.currentIndex = 0;
      this.correctCount = 0;
      this.wrongCount = 0;
      this.scene.restart();
    });

    this.createResultButton(GAME_WIDTH / 2 + 120, 380, '📊 Dashboard', COLORS.SECONDARY, () => {
      this.scene.start('TeacherDashboardScene');
    });

    this.input.keyboard.on('keydown-ESC', () => {
      this.scene.start('TeacherDashboardScene');
    });
  }

  createResultButton(x, y, text, color, onClick) {
    const container = this.add.container(x, y);
    const width = 180;
    const height = 45;

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

  shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}
