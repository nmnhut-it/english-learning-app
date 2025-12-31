/**
 * Copy & Revise Scene - Display vocabulary list for copying, then hide words/meanings for revision.
 * Modes: COPY (show all), REVISE_WORDS (hide English), REVISE_MEANINGS (hide Vietnamese)
 */

class CopyReviseScene extends Phaser.Scene {
  constructor() {
    super('CopyReviseScene');
    this.words = [];
    this.currentPage = 0;
    this.mode = 'copy'; // 'copy', 'revise_words', 'revise_meanings'
    this.hiddenIndices = new Set();
    this.wordsPerPage = 8;
    this.wordElements = [];
  }

  create() {
    const vocabSet = getCurrentVocabSet();
    this.words = [...vocabSet.items];
    this.currentPage = 0;
    this.mode = 'copy';
    this.hiddenIndices = new Set();

    this.createTopBar(vocabSet);
    this.createModeButtons();
    this.createNavigationButtons();
    this.createWordList();
    this.setupKeyboard();
  }

  createTopBar(vocabSet) {
    this.add.rectangle(GAME_WIDTH / 2, 35, GAME_WIDTH, 70, COLORS.BG_CARD);

    // Back button
    const backBtn = this.add.text(20, 35, LANG.back, {
      fontSize: '16px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.PRIMARY,
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

    backBtn.on('pointerdown', () => {
      AudioManager.playEffect('click');
      this.scene.start('MenuScene');
    });

    // Title
    this.add.text(GAME_WIDTH / 2, 25, LANG.modes.copyRevise.title, {
      fontSize: '22px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Vocab set name
    this.add.text(GAME_WIDTH / 2, 50, `${vocabSet.title} (${this.words.length} ${LANG.words.split(' ')[0]})`, {
      fontSize: '14px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0.5);
  }

  createModeButtons() {
    const y = 95;
    const buttonWidth = 180;
    const spacing = 20;
    const startX = GAME_WIDTH / 2 - buttonWidth - spacing;

    const modes = [
      { key: 'copy', label: LANG.modes.copyRevise.showAll, color: COLORS.PRIMARY },
      { key: 'revise_words', label: LANG.modes.copyRevise.hideWords, color: COLORS.ACCENT_CYAN },
      { key: 'revise_meanings', label: LANG.modes.copyRevise.hideMeanings, color: COLORS.SECONDARY },
    ];

    this.modeButtons = [];

    modes.forEach((mode, i) => {
      const x = startX + i * (buttonWidth + spacing);
      const btn = this.createModeButton(x, y, buttonWidth, mode);
      this.modeButtons.push({ btn, mode: mode.key, color: mode.color });
    });

    this.updateModeButtonStyles();
  }

  createModeButton(x, y, width, mode) {
    const container = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, width, 36, mode.color, 0.15)
      .setStrokeStyle(2, mode.color);
    const label = this.add.text(0, 0, mode.label, {
      fontSize: '14px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    container.add([bg, label]);
    container.setSize(width, 36);
    container.setInteractive({ useHandCursor: true });
    container.bg = bg;
    container.label = label;

    container.on('pointerdown', () => {
      AudioManager.playEffect('click');
      this.setMode(mode.key);
    });

    return container;
  }

  updateModeButtonStyles() {
    this.modeButtons.forEach(({ btn, mode, color }) => {
      if (mode === this.mode) {
        btn.bg.setFillStyle(color, 0.9);
        btn.label.setColor('#ffffff');
      } else {
        btn.bg.setFillStyle(color, 0.15);
        btn.label.setColor(COLOR_STRINGS.TEXT);
      }
    });
  }

  setMode(newMode) {
    if (newMode === this.mode) return;

    this.mode = newMode;
    this.updateModeButtonStyles();

    // Randomly hide some words for revise modes
    if (newMode !== 'copy') {
      this.randomizeHidden();
    } else {
      this.hiddenIndices.clear();
    }

    this.renderWordList();
  }

  randomizeHidden() {
    this.hiddenIndices.clear();
    const startIdx = this.currentPage * this.wordsPerPage;
    const endIdx = Math.min(startIdx + this.wordsPerPage, this.words.length);
    const pageWords = endIdx - startIdx;

    // Hide about 40-60% of words on the page
    const hideCount = Math.floor(pageWords * (0.4 + Math.random() * 0.2));

    const indices = [];
    for (let i = startIdx; i < endIdx; i++) {
      indices.push(i);
    }

    // Shuffle and pick
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    for (let i = 0; i < hideCount; i++) {
      this.hiddenIndices.add(indices[i]);
    }
  }

  createNavigationButtons() {
    const y = GAME_HEIGHT - 40;

    // Previous page
    this.prevBtn = this.createNavButton(GAME_WIDTH / 2 - 120, y, '← Trang trước', () => {
      if (this.currentPage > 0) {
        this.currentPage--;
        this.onPageChange();
      }
    });

    // Page indicator
    this.pageText = this.add.text(GAME_WIDTH / 2, y, '', {
      fontSize: '16px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT,
    }).setOrigin(0.5);

    // Next page
    this.nextBtn = this.createNavButton(GAME_WIDTH / 2 + 120, y, 'Trang sau →', () => {
      const maxPage = Math.ceil(this.words.length / this.wordsPerPage) - 1;
      if (this.currentPage < maxPage) {
        this.currentPage++;
        this.onPageChange();
      }
    });

    // Shuffle button
    this.createNavButton(GAME_WIDTH - 80, y, '🔀 Đổi', () => {
      if (this.mode !== 'copy') {
        this.randomizeHidden();
        this.renderWordList();
      }
    });

    this.updatePageText();
  }

  createNavButton(x, y, text, onClick) {
    const btn = this.add.text(x, y, text, {
      fontSize: '14px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.PRIMARY,
      fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerdown', () => {
      AudioManager.playEffect('click');
      onClick();
    });

    btn.on('pointerover', () => btn.setScale(1.05));
    btn.on('pointerout', () => btn.setScale(1));

    return btn;
  }

  onPageChange() {
    if (this.mode !== 'copy') {
      this.randomizeHidden();
    }
    this.renderWordList();
    this.updatePageText();
  }

  updatePageText() {
    const maxPage = Math.ceil(this.words.length / this.wordsPerPage);
    this.pageText.setText(`Trang ${this.currentPage + 1} / ${maxPage}`);
  }

  createWordList() {
    this.wordListContainer = this.add.container(0, 0);
    this.renderWordList();
  }

  renderWordList() {
    // Clear previous
    this.wordListContainer.removeAll(true);
    this.wordElements = [];

    const startY = 130;
    const rowHeight = 55;
    const startIdx = this.currentPage * this.wordsPerPage;
    const endIdx = Math.min(startIdx + this.wordsPerPage, this.words.length);

    // Header row
    this.createHeaderRow(startY - 25);

    // Word rows
    for (let i = startIdx; i < endIdx; i++) {
      const word = this.words[i];
      const y = startY + (i - startIdx) * rowHeight;
      this.createWordRow(i, word, y);
    }
  }

  createHeaderRow(y) {
    const cols = this.getColumnPositions();

    this.add.rectangle(GAME_WIDTH / 2, y, GAME_WIDTH - 40, 28, COLORS.PRIMARY, 0.1);

    const headers = [
      { x: cols.num, text: '#', width: 40 },
      { x: cols.word, text: 'Từ vựng', width: 180 },
      { x: cols.pos, text: 'Loại', width: 60 },
      { x: cols.meaning, text: 'Nghĩa tiếng Việt', width: 280 },
    ];

    headers.forEach(h => {
      this.wordListContainer.add(
        this.add.text(h.x, y, h.text, {
          fontSize: '13px',
          fontFamily: 'Segoe UI, system-ui',
          color: COLOR_STRINGS.TEXT_MUTED,
          fontStyle: 'bold',
        }).setOrigin(0, 0.5)
      );
    });
  }

  getColumnPositions() {
    return {
      num: 30,
      word: 70,
      ipa: 200,
      pos: 320,
      meaning: 390,
    };
  }

  createWordRow(index, word, y) {
    const cols = this.getColumnPositions();
    const isHidden = this.hiddenIndices.has(index);
    const hideWord = this.mode === 'revise_words' && isHidden;
    const hideMeaning = this.mode === 'revise_meanings' && isHidden;

    // Row background
    const rowBg = this.add.rectangle(GAME_WIDTH / 2, y, GAME_WIDTH - 40, 48,
      index % 2 === 0 ? COLORS.BG_CARD : COLORS.BG_DARK, 0.5)
      .setStrokeStyle(1, COLORS.PRIMARY, 0.2);
    this.wordListContainer.add(rowBg);

    // Number
    this.wordListContainer.add(
      this.add.text(cols.num, y, `${index + 1}`, {
        fontSize: '14px',
        fontFamily: 'Segoe UI, system-ui',
        color: COLOR_STRINGS.TEXT_MUTED,
      }).setOrigin(0, 0.5)
    );

    // Word (or hidden placeholder)
    if (hideWord) {
      const placeholder = this.createHiddenPlaceholder(cols.word, y, 150);
      this.wordListContainer.add(placeholder);
      placeholder.setInteractive({ useHandCursor: true });
      placeholder.on('pointerdown', () => this.revealWord(index, 'word'));
    } else {
      const wordText = this.add.text(cols.word, y - 8, word.word, {
        fontSize: '18px',
        fontFamily: 'Segoe UI, system-ui',
        color: COLOR_STRINGS.TEXT,
        fontStyle: 'bold',
      }).setOrigin(0, 0.5);
      this.wordListContainer.add(wordText);

      // IPA below word
      if (word.ipa) {
        const ipaText = this.add.text(cols.word, y + 12, word.ipa, {
          fontSize: '12px',
          fontFamily: 'Segoe UI, system-ui',
          color: COLOR_STRINGS.ACCENT_CYAN,
        }).setOrigin(0, 0.5);
        this.wordListContainer.add(ipaText);
      }

      // Audio button
      const audioBtn = this.add.text(cols.word + 160, y, '🔊', {
        fontSize: '16px',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      audioBtn.on('pointerdown', () => AudioManager.playWord(word.word));
      this.wordListContainer.add(audioBtn);
    }

    // Part of speech
    this.wordListContainer.add(
      this.add.text(cols.pos, y, word.pos || '', {
        fontSize: '12px',
        fontFamily: 'Segoe UI, system-ui',
        color: COLOR_STRINGS.TEXT_MUTED,
        backgroundColor: COLOR_STRINGS.BG_LIGHT,
        padding: { x: 6, y: 3 },
      }).setOrigin(0, 0.5)
    );

    // Meaning (or hidden placeholder)
    if (hideMeaning) {
      const placeholder = this.createHiddenPlaceholder(cols.meaning, y, 200);
      this.wordListContainer.add(placeholder);
      placeholder.setInteractive({ useHandCursor: true });
      placeholder.on('pointerdown', () => this.revealWord(index, 'meaning'));
    } else {
      const meaningText = this.add.text(cols.meaning, y, word.meaning, {
        fontSize: '16px',
        fontFamily: 'Segoe UI, system-ui',
        color: COLOR_STRINGS.SECONDARY,
        wordWrap: { width: 200 },
      }).setOrigin(0, 0.5);
      this.wordListContainer.add(meaningText);
    }

    this.wordElements.push({ index, rowBg });
  }

  createHiddenPlaceholder(x, y, width) {
    const container = this.add.container(x + width / 2, y);

    const bg = this.add.rectangle(0, 0, width, 30, COLORS.WARNING, 0.3)
      .setStrokeStyle(2, COLORS.WARNING, 0.5);

    const text = this.add.text(0, 0, '? Chạm để xem', {
      fontSize: '14px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.WARNING,
    }).setOrigin(0.5);

    container.add([bg, text]);
    container.setSize(width, 30);

    return container;
  }

  revealWord(index, type) {
    AudioManager.playEffect('correct');
    this.hiddenIndices.delete(index);
    this.renderWordList();
  }

  setupKeyboard() {
    // ESC to go back
    this.input.keyboard.on('keydown-ESC', () => {
      AudioManager.playEffect('click');
      this.scene.start('MenuScene');
    });

    // Arrow keys for navigation
    this.input.keyboard.on('keydown-LEFT', () => {
      if (this.currentPage > 0) {
        this.currentPage--;
        this.onPageChange();
      }
    });

    this.input.keyboard.on('keydown-RIGHT', () => {
      const maxPage = Math.ceil(this.words.length / this.wordsPerPage) - 1;
      if (this.currentPage < maxPage) {
        this.currentPage++;
        this.onPageChange();
      }
    });

    // Number keys for modes
    this.input.keyboard.on('keydown-ONE', () => this.setMode('copy'));
    this.input.keyboard.on('keydown-TWO', () => this.setMode('revise_words'));
    this.input.keyboard.on('keydown-THREE', () => this.setMode('revise_meanings'));

    // R to reshuffle hidden words
    this.input.keyboard.on('keydown-R', () => {
      if (this.mode !== 'copy') {
        this.randomizeHidden();
        this.renderWordList();
      }
    });
  }
}
