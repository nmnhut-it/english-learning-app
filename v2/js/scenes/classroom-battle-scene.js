/**
 * Classroom Battle Scene - Hot Seat multiplayer mode
 * Students pass a keyboard around to compete
 */

const CLASS_STORAGE_KEY = 'classroom_rosters';

class ClassroomBattleScene extends Phaser.Scene {
  constructor() {
    super('ClassroomBattleScene');
    this.players = [];
    this.currentPlayerIndex = 0;
    this.currentQuestionIndex = 0;
    this.questionsPerPlayer = 3;
    this.totalRounds = 1;
    this.currentRound = 0;
    this.words = [];
    this.gameState = 'setup'; // setup, playing, passing, complete
    this.currentClassName = '';
  }

  // ========== Class Roster Management ==========

  getSavedClasses() {
    try {
      return JSON.parse(localStorage.getItem(CLASS_STORAGE_KEY) || '{}');
    } catch {
      return {};
    }
  }

  saveClass(className, students) {
    const classes = this.getSavedClasses();
    classes[className] = {
      students,
      updatedAt: Date.now()
    };
    localStorage.setItem(CLASS_STORAGE_KEY, JSON.stringify(classes));
  }

  deleteClass(className) {
    const classes = this.getSavedClasses();
    delete classes[className];
    localStorage.setItem(CLASS_STORAGE_KEY, JSON.stringify(classes));
  }

  loadClass(className) {
    const classes = this.getSavedClasses();
    if (classes[className]) {
      this.players = [...classes[className].students];
      this.currentClassName = className;
      return true;
    }
    return false;
  }

  // ========== Scene Setup ==========

  create() {
    this.gameState = 'setup';
    this.players = [];
    this.currentPlayerIndex = 0;
    this.currentRound = 0;
    this.currentClassName = '';

    // Background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.BG_DARK);

    this.showSetupScreen();
  }

  showSetupScreen() {
    this.setupContainer = this.add.container(0, 0);

    // Title
    this.add.text(GAME_WIDTH / 2, 30, '🏆 Thi Đấu Lớp Học', {
      fontSize: '28px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.GOLD,
      fontStyle: 'bold',
    }).setOrigin(0.5);

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

    // Left panel: Saved classes
    this.createSavedClassesPanel();

    // Right panel: Current class
    this.createCurrentClassPanel();

    // Bottom: Settings & Start
    this.createBottomPanel();

    // Keyboard input
    this.setupPlayerInput();
  }

  createSavedClassesPanel() {
    const x = 160;
    const y = 70;

    // Panel title
    this.add.text(x, y, '📁 Lớp đã lưu', {
      fontSize: '16px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.SECONDARY,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Saved classes list
    const classes = this.getSavedClasses();
    const classNames = Object.keys(classes).sort();

    if (classNames.length === 0) {
      this.add.text(x, y + 50, '(Chưa có lớp nào)', {
        fontSize: '13px',
        fontFamily: 'Segoe UI, system-ui',
        color: COLOR_STRINGS.TEXT_MUTED,
      }).setOrigin(0.5);
    } else {
      classNames.forEach((name, i) => {
        if (i >= 8) return; // Max 8 classes shown
        const classData = classes[name];
        const btnY = y + 35 + i * 40;

        // Class button
        const btn = this.add.container(x, btnY);
        const bg = this.add.rectangle(0, 0, 250, 34, COLORS.BG_CARD)
          .setStrokeStyle(1, COLORS.SECONDARY);
        const text = this.add.text(-100, 0, `${name} (${classData.students.length} HS)`, {
          fontSize: '14px',
          fontFamily: 'Segoe UI, system-ui',
          color: COLOR_STRINGS.TEXT,
        }).setOrigin(0, 0.5);

        // Delete button
        const delBtn = this.add.text(110, 0, '✕', {
          fontSize: '14px',
          fontFamily: 'Segoe UI, system-ui',
          color: COLOR_STRINGS.INCORRECT,
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        delBtn.on('pointerdown', (p) => {
          p.stopPropagation();
          this.deleteClass(name);
          this.scene.restart();
        });

        btn.add([bg, text, delBtn]);
        btn.setSize(250, 34);
        btn.setInteractive({ useHandCursor: true });

        btn.on('pointerover', () => bg.setFillStyle(COLORS.BG_LIGHT));
        btn.on('pointerout', () => bg.setFillStyle(COLORS.BG_CARD));
        btn.on('pointerdown', () => {
          AudioManager.playEffect('click');
          this.loadClass(name);
          this.updatePlayerList();
          this.updateClassNameDisplay();
        });
      });
    }
  }

  createCurrentClassPanel() {
    const x = 520;
    const y = 70;

    // Panel title with class name input hint
    this.add.text(x, y, '👥 Danh sách học sinh', {
      fontSize: '16px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.SECONDARY,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Class name display/input
    this.classNameText = this.add.text(x, y + 25, 'Gõ tên lớp...', {
      fontSize: '13px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0.5);

    // Player list
    this.playerListText = this.add.text(340, y + 50, '', {
      fontSize: '14px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT,
      lineSpacing: 4,
    });

    // Quick add buttons
    this.createQuickAddButtons(x, y + 25);

    this.updatePlayerList();
  }

  createQuickAddButtons(x, baseY) {
    const y = 380;

    this.createSmallButton(x - 130, y, '+ HS 1-5', () => {
      for (let i = 1; i <= 5; i++) {
        const name = `Học sinh ${i}`;
        if (!this.players.includes(name)) {
          this.players.push(name);
        }
      }
      this.updatePlayerList();
    });

    this.createSmallButton(x - 40, y, '+5 HS', () => {
      const start = this.players.length + 1;
      for (let i = start; i < start + 5; i++) {
        this.players.push(`Học sinh ${i}`);
      }
      this.updatePlayerList();
    });

    this.createSmallButton(x + 50, y, 'Xóa hết', () => {
      this.players = [];
      this.currentClassName = '';
      this.updatePlayerList();
      this.updateClassNameDisplay();
    });

    this.createSmallButton(x + 140, y, '💾 Lưu lớp', () => {
      if (this.players.length > 0 && this.currentClassName) {
        this.saveClass(this.currentClassName, this.players);
        AudioManager.playEffect('correct');
        this.scene.restart();
      } else if (this.players.length > 0) {
        // Need class name
        AudioManager.playEffect('incorrect');
      }
    });
  }

  createBottomPanel() {
    const y = GAME_HEIGHT - 100;

    // Vocab set info
    const vocabSet = getCurrentVocabSet();
    this.add.text(GAME_WIDTH / 2, y - 50, `📚 ${vocabSet.title} (${vocabSet.items.length} từ)`, {
      fontSize: '13px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.SECONDARY,
    }).setOrigin(0.5);

    // Questions per turn
    this.add.text(GAME_WIDTH / 2 - 100, y - 20, 'Số câu/lượt:', {
      fontSize: '13px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0, 0.5);

    [1, 3, 5].forEach((num, i) => {
      const btn = this.add.text(GAME_WIDTH / 2 + 20 + i * 45, y - 20, String(num), {
        fontSize: '15px',
        fontFamily: 'Segoe UI, system-ui',
        color: num === this.questionsPerPlayer ? COLOR_STRINGS.GOLD : COLOR_STRINGS.TEXT_MUTED,
        backgroundColor: num === this.questionsPerPlayer ? '#6366f1' : '#16213e',
        padding: { x: 10, y: 5 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      btn.on('pointerdown', () => {
        this.questionsPerPlayer = num;
        this.scene.restart();
      });
    });

    // Start button
    this.startBtn = this.createButton(
      GAME_WIDTH / 2, y + 30,
      280, 50,
      '▶ BẮT ĐẦU THI ĐẤU',
      COLORS.CORRECT,
      () => this.startGame()
    );
    this.startBtn.setAlpha(0.5);

    // Instructions
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 25,
      'Gõ tên HS + Enter | Gõ "lớp:" + tên để đặt tên lớp', {
      fontSize: '11px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0.5);
  }

  updateClassNameDisplay() {
    if (this.currentClassName) {
      this.classNameText.setText(`📝 ${this.currentClassName}`);
      this.classNameText.setColor(COLOR_STRINGS.GOLD);
    } else {
      this.classNameText.setText('Gõ "lớp:7A" để đặt tên');
      this.classNameText.setColor(COLOR_STRINGS.TEXT_MUTED);
    }
  }

  createSmallButton(x, y, text, onClick) {
    const btn = this.add.text(x, y, text, {
      fontSize: '12px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.SECONDARY,
      backgroundColor: '#16213e',
      padding: { x: 10, y: 5 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setColor(COLOR_STRINGS.TEXT));
    btn.on('pointerout', () => btn.setColor(COLOR_STRINGS.SECONDARY));
    btn.on('pointerdown', () => {
      AudioManager.playEffect('click');
      onClick();
    });

    return btn;
  }

  setupPlayerInput() {
    this.inputText = '';

    this.input.keyboard.on('keydown', (event) => {
      if (this.gameState !== 'setup') return;

      if (event.key === 'Enter' && this.inputText.trim()) {
        const input = this.inputText.trim();

        // Check for class name command: "lớp:7A" or "class:7A"
        if (input.toLowerCase().startsWith('lớp:') || input.toLowerCase().startsWith('class:')) {
          const className = input.split(':')[1].trim();
          if (className) {
            this.currentClassName = className;
            this.updateClassNameDisplay();
            AudioManager.playEffect('correct');
          }
        } else {
          // Add player
          if (!this.players.includes(input)) {
            this.players.push(input);
            this.updatePlayerList();
            AudioManager.playEffect('click');
          }
        }
        this.inputText = '';
      } else if (event.key === 'Backspace') {
        this.inputText = this.inputText.slice(0, -1);
      } else if (event.key.length === 1) {
        this.inputText += event.key;
      }
    });

    // ESC to go back
    this.input.keyboard.on('keydown-ESC', () => {
      if (this.gameState === 'setup') {
        AudioManager.playEffect('click');
        this.scene.start('MenuScene');
      }
    });
  }

  updatePlayerList() {
    if (this.players.length === 0) {
      this.playerListText.setText('Chưa có học sinh...\n\n💡 Gõ tên + Enter\nhoặc chọn lớp bên trái');
    } else {
      // Show in 2 columns if more than 10
      if (this.players.length <= 10) {
        const list = this.players.map((p, i) => `${i + 1}. ${p}`).join('\n');
        this.playerListText.setText(list);
      } else {
        const mid = Math.ceil(this.players.length / 2);
        const col1 = this.players.slice(0, mid).map((p, i) => `${i + 1}. ${p}`);
        const col2 = this.players.slice(mid).map((p, i) => `${mid + i + 1}. ${p}`);
        const combined = col1.map((c1, i) => c1.padEnd(20) + (col2[i] || '')).join('\n');
        this.playerListText.setText(combined);
      }
    }

    // Enable/disable start button
    if (this.players.length >= 2) {
      this.startBtn.setAlpha(1);
    } else {
      this.startBtn.setAlpha(0.5);
    }
  }

  startGame() {
    if (this.players.length < 2) {
      // Show warning
      return;
    }

    AudioManager.playEffect('click');

    // Initialize scores
    this.playerScores = {};
    this.players.forEach(p => this.playerScores[p] = 0);

    // Get vocabulary
    const vocabSet = getCurrentVocabSet();
    this.words = this.shuffleArray([...vocabSet.items]);
    this.wordIndex = 0;

    this.currentPlayerIndex = 0;
    this.currentQuestionIndex = 0;
    this.gameState = 'playing';

    // Clear setup
    this.children.removeAll();

    // Show first turn
    this.showPlayerTurn();
  }

  showPlayerTurn() {
    this.children.removeAll();

    const player = this.players[this.currentPlayerIndex];

    // Background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.BG_DARK);

    // Current player indicator
    this.add.text(GAME_WIDTH / 2, 50, `🎮 Lượt của:`, {
      fontSize: '20px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 95, player, {
      fontSize: '36px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.GOLD,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Score
    this.add.text(GAME_WIDTH / 2, 135, `Điểm: ${this.playerScores[player]}`, {
      fontSize: '18px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0.5);

    // Question progress
    this.add.text(GAME_WIDTH / 2, 165, `Câu ${this.currentQuestionIndex + 1}/${this.questionsPerPlayer}`, {
      fontSize: '14px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.SECONDARY,
    }).setOrigin(0.5);

    // Show question
    this.showQuestion();
  }

  showQuestion() {
    if (this.wordIndex >= this.words.length) {
      this.words = this.shuffleArray(this.words);
      this.wordIndex = 0;
    }

    const word = this.words[this.wordIndex];
    this.currentWord = word;
    this.hasAnswered = false;

    // Word display
    const wordBg = this.add.rectangle(GAME_WIDTH / 2, 260, 500, 100, COLORS.BG_CARD)
      .setStrokeStyle(3, COLORS.PRIMARY);

    this.add.text(GAME_WIDTH / 2, 245, word.word, {
      fontSize: '32px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 285, word.ipa || '', {
      fontSize: '18px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.SECONDARY,
    }).setOrigin(0.5);

    // Play pronunciation
    AudioManager.playWord(word.word);

    // Generate options
    const options = this.generateOptions(word);
    this.optionButtons = [];

    options.forEach((opt, i) => {
      const y = 360 + i * 55;
      const isCorrect = opt === word.meaning;
      const btn = this.createOptionButton(GAME_WIDTH / 2, y, opt, isCorrect, i);
      this.optionButtons.push(btn);
    });

    // Keyboard hints
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 30,
      '1-4: Chọn đáp án | SPACE: Nghe lại', {
      fontSize: '12px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0.5);

    // Setup keyboard for this question
    this.setupQuestionKeyboard();
  }

  createOptionButton(x, y, meaning, isCorrect, index) {
    const container = this.add.container(x, y);
    const width = 550;
    const height = 48;

    const bg = this.add.rectangle(0, 0, width, height, COLORS.BG_CARD)
      .setStrokeStyle(2, COLORS.SECONDARY);

    // Hotkey
    const hotkeyBg = this.add.rectangle(-width/2 + 25, 0, 32, 32, COLORS.SECONDARY, 0.3);
    const hotkeyText = this.add.text(-width/2 + 25, 0, String(index + 1), {
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

  setupQuestionKeyboard() {
    // Remove old listeners
    this.input.keyboard.removeAllListeners();

    // 1-4 for options
    ['ONE', 'TWO', 'THREE', 'FOUR'].forEach((key, i) => {
      this.input.keyboard.on(`keydown-${key}`, () => {
        if (!this.hasAnswered && this.optionButtons[i]) {
          this.handleAnswer(this.optionButtons[i]);
        }
      });
    });

    // Space to replay
    this.input.keyboard.on('keydown-SPACE', () => {
      AudioManager.playWord(this.currentWord.word);
    });
  }

  handleAnswer(button) {
    this.hasAnswered = true;
    const player = this.players[this.currentPlayerIndex];

    // Disable all buttons
    this.optionButtons.forEach(btn => btn.disableInteractive());

    if (button.isCorrect) {
      AudioManager.playEffect('correct');
      button.optionBg.setFillStyle(COLORS.CORRECT);
      button.optionBg.setStrokeStyle(3, COLORS.CORRECT);

      // Add points
      this.playerScores[player] += 10;

      // Show feedback
      this.showFeedback('✓ Đúng rồi! +10 điểm', COLORS.CORRECT);
    } else {
      AudioManager.playEffect('incorrect');
      button.optionBg.setFillStyle(COLORS.INCORRECT);

      // Show correct answer
      this.optionButtons.forEach(btn => {
        if (btn.isCorrect) {
          btn.optionBg.setFillStyle(COLORS.CORRECT);
          btn.optionBg.setStrokeStyle(3, COLORS.CORRECT);
        }
      });

      this.showFeedback('✗ Sai rồi!', COLORS.INCORRECT);
    }

    // Next question or pass
    this.time.delayedCall(1500, () => {
      this.wordIndex++;
      this.currentQuestionIndex++;

      if (this.currentQuestionIndex >= this.questionsPerPlayer) {
        // Pass to next player
        this.currentQuestionIndex = 0;
        this.currentPlayerIndex++;

        if (this.currentPlayerIndex >= this.players.length) {
          // Game complete
          this.showFinalResults();
        } else {
          // Show pass screen
          this.showPassScreen();
        }
      } else {
        // Next question same player
        this.showPlayerTurn();
      }
    });
  }

  showFeedback(text, color) {
    const feedback = this.add.text(GAME_WIDTH / 2, 200, text, {
      fontSize: '24px',
      fontFamily: 'Segoe UI, system-ui',
      color: color === COLORS.CORRECT ? COLOR_STRINGS.CORRECT : COLOR_STRINGS.INCORRECT,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: feedback,
      y: 190,
      alpha: 0,
      duration: 1000,
      delay: 500,
    });
  }

  showPassScreen() {
    this.children.removeAll();

    const nextPlayer = this.players[this.currentPlayerIndex];

    // Background with emphasis
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1a1a2e);

    // Big arrow animation
    const arrow = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, '👉', {
      fontSize: '80px',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: arrow,
      x: GAME_WIDTH / 2 + 30,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    // Pass message
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, 'CHUYỀN BÀN PHÍM CHO:', {
      fontSize: '24px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 70, nextPlayer, {
      fontSize: '40px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.GOLD,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Countdown
    let countdown = 3;
    const countdownText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 140, countdown.toString(), {
      fontSize: '48px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.SECONDARY,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const timer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        countdown--;
        if (countdown > 0) {
          countdownText.setText(countdown.toString());
          AudioManager.playEffect('click');
        } else {
          timer.remove();
          this.showPlayerTurn();
        }
      },
      repeat: 2,
    });

    // Press any key to skip
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 50, 'Nhấn phím bất kỳ để bắt đầu ngay', {
      fontSize: '14px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0.5);

    this.input.keyboard.once('keydown', () => {
      timer.remove();
      this.showPlayerTurn();
    });
  }

  showFinalResults() {
    this.children.removeAll();
    this.gameState = 'complete';

    AudioManager.playEffect('complete');

    // Background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.BG_DARK);

    // Title
    this.add.text(GAME_WIDTH / 2, 50, '🏆 KẾT QUẢ THI ĐẤU', {
      fontSize: '32px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.GOLD,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Sort players by score
    const sorted = Object.entries(this.playerScores)
      .sort((a, b) => b[1] - a[1]);

    // Show rankings
    const medals = ['🥇', '🥈', '🥉'];
    sorted.forEach(([name, score], i) => {
      const y = 120 + i * 45;
      const medal = i < 3 ? medals[i] : `${i + 1}.`;
      const fontSize = i < 3 ? '24px' : '18px';
      const color = i === 0 ? COLOR_STRINGS.GOLD :
                    i === 1 ? '#c0c0c0' :
                    i === 2 ? '#cd7f32' : COLOR_STRINGS.TEXT;

      this.add.text(150, y, `${medal} ${name}`, {
        fontSize,
        fontFamily: 'Segoe UI, system-ui',
        color,
        fontStyle: i < 3 ? 'bold' : 'normal',
      }).setOrigin(0, 0.5);

      this.add.text(GAME_WIDTH - 150, y, `${score} điểm`, {
        fontSize,
        fontFamily: 'Segoe UI, system-ui',
        color,
        fontStyle: i < 3 ? 'bold' : 'normal',
      }).setOrigin(1, 0.5);
    });

    // Play again button
    this.createButton(
      GAME_WIDTH / 2 - 120, GAME_HEIGHT - 60,
      200, 45,
      '🔄 Chơi lại',
      COLORS.PRIMARY,
      () => this.scene.restart()
    );

    // Back to menu
    this.createButton(
      GAME_WIDTH / 2 + 120, GAME_HEIGHT - 60,
      200, 45,
      '🏠 Menu',
      COLORS.SECONDARY,
      () => this.scene.start('MenuScene')
    );

    // Keyboard
    this.input.keyboard.on('keydown-ESC', () => {
      this.scene.start('MenuScene');
    });
  }

  generateOptions(correctWord) {
    const options = [correctWord.meaning];
    const others = this.words.filter(w => w.word !== correctWord.word);
    const shuffled = this.shuffleArray(others);

    for (let i = 0; i < 3 && i < shuffled.length; i++) {
      options.push(shuffled[i].meaning);
    }

    return this.shuffleArray(options);
  }

  shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
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
}
